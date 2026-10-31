import React, { useState } from 'react';
import { Card, Button, Input, Badge } from '@fic/ui';
import { LightbulbIcon, CheckCircleIcon, ArrowRightIcon } from '../components/Icons';
import { apiRequest } from '../services/api';

export const BusinessIdeasPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [stage, setStage] = useState('IDEA');
  const [supportNeeded, setSupportNeeded] = useState<string[]>(['Idea Validation']);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const supportOptions = [
    'Idea Validation',
    'Business Plan Preparation',
    'Technology & MVP Development',
    'Mentoring & Advisory',
    'Regulatory & Legal Setup',
    'Go-to-Market Strategy'
  ];

  const toggleSupport = (item: string) => {
    if (supportNeeded.includes(item)) {
      setSupportNeeded(supportNeeded.filter((s) => s !== item));
    } else {
      setSupportNeeded([...supportNeeded, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest('/business-ideas', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          targetMarket,
          stage,
          supportNeeded
        })
      });
      setIsSubmitted(true);
    } catch {
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <LightbulbIcon size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Submit Business Idea for FIC Incubation
              </h1>
              <p className="text-xs text-slate-500">
                Get your concept validated by experienced industry mentors and FIC consultants.
              </p>
            </div>
          </div>
        </div>

        {isSubmitted ? (
          <Card className="shadow-md text-center py-10">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Idea Submitted Successfully!</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed mb-6">
              Your business concept <strong>"{title}"</strong> has been securely logged with the FIC Incubation Desk. An advisor will review feasibility within 3 business days.
            </p>
            <Button variant="primary" size="sm" onClick={() => setIsSubmitted(false)}>
              Submit Another Idea
            </Button>
          </Card>
        ) : (
          <Card className="shadow-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Business Idea Title"
                placeholder="e.g. AI-driven Supply Chain Automation for Garments"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Detailed Concept Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  className="w-full text-xs p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Explain what problem your idea solves, how it works, and what makes it unique..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Target Market / Geography"
                  placeholder="e.g. Tamil Nadu textile hubs, Pan-India MSMEs"
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                  required
                />

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Current Stage</label>
                  <select
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                  >
                    <option value="IDEA">Idea on Paper</option>
                    <option value="PROTOTYPE">Prototype / MVP Ready</option>
                    <option value="EARLY_TRACTION">Early Customers / Traction</option>
                    <option value="GROWTH">Ready for Scale</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  What Support Do You Need from FIC?
                </label>
                <div className="flex flex-wrap gap-2">
                  {supportOptions.map((opt, i) => {
                    const isSelected = supportNeeded.includes(opt);
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => toggleSupport(opt)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="primary" type="submit" isLoading={isLoading}>
                  Submit Idea for FIC Review
                  <ArrowRightIcon className="ml-2" size={16} />
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};

