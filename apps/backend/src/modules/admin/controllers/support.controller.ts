import { Router, Response } from 'express';
import { SupportTicketModel } from '../models/SupportTicket';
import { MemberModel } from '../models/Member';
import { authenticateAdmin, AuthenticatedAdminRequest, logAdminAction } from '../middleware/admin-auth.middleware';

const router = Router();

// GET /api/admin/support/tickets - List all tickets with filtering options
router.get('/tickets', authenticateAdmin, async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    const filter: any = {};
    if (status && status !== 'ALL') filter.status = status;
    if (priority && priority !== 'ALL') filter.priority = priority;
    if (category && category !== 'ALL') filter.category = category;

    let tickets = await SupportTicketModel.find(filter)
      .populate('memberId', 'name email phone primaryCategoryName')
      .sort({ updatedAt: -1 })
      .lean();

    // Map formatted member info
    const formatted = tickets.map((t: any) => ({
      ...t,
      id: t._id.toString(),
      memberId: t.memberId || {
        name: t.memberName || 'Customer Member',
        email: t.memberEmail || 'member@ficapp.in',
        phone: t.memberPhone || ''
      }
    }));

    res.json({ success: true, data: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Member-facing routes for Live Help & Support Desk:
// POST /api/admin/support/member/create - Member opens ticket or enquiry
router.post('/member/create', async (req, res) => {
  try {
    const { memberEmail, memberName, memberPhone, subject, category, priority, message } = req.body;
    if (!subject || !message) {
      res.status(400).json({ success: false, error: 'Subject and message are required' });
      return;
    }

    const email = (memberEmail || '').toLowerCase();
    const member = email ? await MemberModel.findOne({ email }) : null;

    const count = await SupportTicketModel.countDocuments();
    const ticketNumber = `TICK-${String(1001 + count).padStart(5, '0')}`;

    const newTicket = await SupportTicketModel.create({
      ticketNumber,
      memberId: member?._id,
      memberName: memberName || member?.name || 'Customer',
      memberEmail: email || member?.email || 'customer@ficapp.in',
      memberPhone: memberPhone || member?.phone || '',
      subject: subject.trim(),
      category: category || 'GENERAL_INQUIRY',
      priority: priority || 'MEDIUM',
      status: 'OPEN',
      messages: [
        {
          sender: 'MEMBER',
          senderName: memberName || member?.name || 'Customer',
          message: message.trim(),
          timestamp: new Date()
        }
      ]
    });

    res.status(201).json({ success: true, data: newTicket });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/support/member/tickets - Customer fetches their support ticket thread
router.get('/member/tickets', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      res.status(400).json({ success: false, error: 'Email parameter is required' });
      return;
    }

    const cleanEmail = (email as string).toLowerCase();
    const member = await MemberModel.findOne({ email: cleanEmail });

    const query: any = {
      $or: [
        { memberEmail: cleanEmail },
        ...(member ? [{ memberId: member._id }] : [])
      ]
    };

    const tickets = await SupportTicketModel.find(query).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, data: tickets });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/support/member/tickets/:id/message - Customer sends message to live chat
router.post('/member/tickets/:id/message', async (req, res) => {
  try {
    const { id } = req.params;
    const { message, senderName } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ success: false, error: 'Message cannot be empty' });
      return;
    }

    const ticket = await SupportTicketModel.findById(id);
    if (!ticket) {
      res.status(404).json({ success: false, error: 'Ticket not found' });
      return;
    }

    ticket.messages.push({
      sender: 'MEMBER',
      senderName: senderName || ticket.memberName || 'Customer',
      message: message.trim(),
      timestamp: new Date()
    });

    // If ticket was resolved or closed, re-open when customer writes back
    if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      ticket.status = 'IN_PROGRESS';
    }

    await ticket.save();
    res.json({ success: true, data: ticket });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/support/tickets/:id - Fetch full ticket conversation
router.get('/tickets/:id', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const ticket = await SupportTicketModel.findById(req.params.id).populate('memberId');
    if (!ticket) {
      res.status(404).json({ success: false, error: 'Support ticket not found' });
      return;
    }
    res.json({ success: true, data: ticket });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/support/tickets/:id/resolve - Mark query/ticket as resolved or closed
router.post('/tickets/:id/resolve', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status = 'RESOLVED', resolutionNote } = req.body;

    const ticket = await SupportTicketModel.findById(id);
    if (!ticket) {
      res.status(404).json({ success: false, error: 'Support ticket not found' });
      return;
    }

    ticket.status = status as any;

    const timestamp = new Date();
    const adminName = req.admin ? req.admin.name : 'FIC Support Team';
    const noteText = resolutionNote && resolutionNote.trim()
      ? resolutionNote.trim()
      : 'This support ticket has been reviewed and marked as completed/resolved by FIC Support.';

    ticket.messages.push({
      sender: 'ADMIN',
      senderId: req.admin?.id as any,
      senderName: adminName,
      message: `[Ticket Completed]: ${noteText}`,
      timestamp
    });

    await ticket.save();

    await logAdminAction(req, 'SUPPORT_TICKET_RESOLVE', 'SupportTicket', id, {
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      resolutionNote: noteText
    });

    const populated = await SupportTicketModel.findById(id).populate('memberId');
    res.json({ success: true, message: `Ticket marked as ${status}`, data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/support/tickets/:id/reply - Append admin reply and update status
router.post('/tickets/:id/reply', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message, status } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ success: false, error: 'Message content is required.' });
      return;
    }

    const ticket = await SupportTicketModel.findById(id);
    if (!ticket) {
      res.status(404).json({ success: false, error: 'Support ticket not found' });
      return;
    }

    ticket.messages.push({
      sender: 'ADMIN',
      senderId: req.admin?.id as any,
      message: message.trim(),
      timestamp: new Date(),
    });

    if (status) {
      ticket.status = status;
    }

    await ticket.save();

    await logAdminAction(req, 'SUPPORT_TICKET_REPLY', 'SupportTicket', id, {
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
    });

    const populated = await SupportTicketModel.findById(id).populate('memberId');
    res.json({ success: true, message: 'Reply sent successfully', data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

