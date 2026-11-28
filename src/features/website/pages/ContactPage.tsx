import React, { useState } from 'react';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { WebsiteLayout } from '../WebsiteLayout';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Anti-bot trap

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Bot detection: if honeypot is filled, silent reject
    if (honeypot.trim()) {
      setStatus('success');
      return;
    }

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMessage('Please fill out all required fields.');
      return;
    }

    if (!email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await setDoc(doc(db(), 'contact_messages', messageId), {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        createdAt: serverTimestamp(),
        status: 'new',
        source: 'website',
        locale: (navigator.language || 'en').slice(0, 12),
      });

      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setStatus('error');
      setErrorMessage('Failed to send message. Please try again or email us directly at support@fitme.sindulis.com.');
    }
  };

  return (
    <WebsiteLayout
      title="Contact Us – FitMe & Sindulis Innovative Solutions"
      description="Get in touch with the FitMe engineering and support team at Sindulis Innovative Solutions for questions, technical inquiries, or feedback."
    >
      {/* Header */}
      <section className="pt-8 pb-14 bg-gradient-to-b from-[#F0FDF4]/60 to-white dark:from-[#152018] dark:to-[#111613]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1FA45B]/10 text-[#1FA45B] text-xs font-bold uppercase tracking-wider">
            Get In Touch
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#11181C] dark:text-white tracking-tight">
            We are here to help.
          </h1>
          <p className="text-base sm:text-lg text-[#5B6471] dark:text-[#9AA89E] max-w-xl mx-auto">
            Have a question about the Android APK, feedback on features, or technical support? Send us a message below.
          </p>
        </div>
      </section>

      {/* Content Form & Details */}
      <section className="py-14 sm:py-20 bg-white dark:bg-[#111613]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Contact Details Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-8 rounded-3xl bg-[#FBFDFB] dark:bg-[#171D18] border border-slate-200/80 dark:border-white/10 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#11181C] dark:text-white">
                    Direct Contact
                  </h2>
                  <p className="text-xs text-[#5B6471] dark:text-[#9AA89E] mt-1">
                    Sindulis Innovative Solutions
                  </p>
                </div>

                <div className="space-y-4 text-sm text-[#5B6471] dark:text-[#9AA89E]">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center text-[#1FA45B] shrink-0">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-[#11181C] dark:text-white">Email Inquiries</div>
                      <a href="mailto:support@fitme.sindulis.com" className="text-xs text-[#1FA45B] hover:underline break-all">
                        support@fitme.sindulis.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center text-[#1FA45B] shrink-0">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-[#11181C] dark:text-white">Headquarters</div>
                      <div className="text-xs text-[#5B6471] dark:text-[#9AA89E]">
                        Sindulis Innovative Solutions
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center text-[#1FA45B] shrink-0">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-[#11181C] dark:text-white">Response Time</div>
                      <div className="text-xs text-[#5B6471] dark:text-[#9AA89E]">
                        Replies within 24 to 48 business hours
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Column */}
            <div className="lg:col-span-7 p-8 sm:p-10 rounded-3xl bg-[#FBFDFB] dark:bg-[#171D18] border border-slate-200/80 dark:border-white/10 shadow-xs">
              {status === 'success' ? (
                <div className="py-12 text-center space-y-4">
                  <div className="h-14 w-14 mx-auto rounded-full bg-[#F0FDF4] text-[#1FA45B] flex items-center justify-center">
                    <svg className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-[#11181C] dark:text-white">
                    Message Received!
                  </h3>
                  <p className="text-sm text-[#5B6471] dark:text-[#9AA89E] max-w-sm mx-auto">
                    Thank you for reaching out. We have logged your request and our team will get back to you shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStatus('idle')}
                    className="mt-4 px-6 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-[#11181C] dark:text-white hover:bg-slate-50 transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-xl font-bold text-[#11181C] dark:text-white">
                    Send a Message
                  </h2>

                  {/* Honeypot field for anti-spam (hidden from users) */}
                  <div className="hidden" aria-hidden="true">
                    <input
                      type="text"
                      name="website_url"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-semibold text-[#11181C] dark:text-white mb-1">
                      Your Name *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Sharma"
                      required
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-[#11181C] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1FA45B]"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-semibold text-[#11181C] dark:text-white mb-1">
                      Your Email *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@example.com"
                      required
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-[#11181C] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1FA45B]"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className="block text-xs font-semibold text-[#11181C] dark:text-white mb-1">
                      Subject
                    </label>
                    <select
                      id="contact-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-[#11181C] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1FA45B]"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Android APK Support">Android APK Installation Support</option>
                      <option value="Health Connect Sync">Health Connect & Sensor Telemetry</option>
                      <option value="Account & Data Question">Account & Data Privacy Question</option>
                      <option value="Feature Suggestion">Feature Suggestion</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-semibold text-[#11181C] dark:text-white mb-1">
                      Message *
                    </label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we help you?"
                      required
                      className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-[#11181C] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1FA45B] resize-none"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full h-12 rounded-xl bg-[#1FA45B] hover:bg-[#178A4C] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
                  >
                    {status === 'submitting' ? 'Sending Message...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
}
