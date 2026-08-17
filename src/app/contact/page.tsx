import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { publicContactEmail, siteConfig } from "@/config/site";
import { Mail, MapPin, MessageCircle } from "lucide-react";

export const metadata: Metadata = { title: "Contact APEX MOTO", description: "Ask APEX MOTO about sizing, stock, orders, delivery, or Newport pickup.", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  const email = publicContactEmail();
  return <div className="page-shell content-page"><div className="container page-hero"><p className="eyebrow eyebrow--accent">Talk to a person</p><h1>Contact.</h1><p>Ask about sizing, exact stock, or Melbourne pickup before you order.</p></div><div className="container contact-layout"><aside className="contact-options">
    <div><Mail aria-hidden="true" /><span><small>Email</small>{email ? <a href={`mailto:${email}`}>{email}</a> : <strong>Email pending owner setup</strong>}</span></div>
    <div><MapPin aria-hidden="true" /><span><small>Pickup area</small><strong>{siteConfig.pickupSuburb}, {siteConfig.state}</strong></span></div>
    <div><MessageCircle aria-hidden="true" /><span><small>Social</small><a href={siteConfig.instagramUrl} target="_blank" rel="noreferrer">Instagram</a><a href={siteConfig.facebookUrl} target="_blank" rel="noreferrer">Facebook</a></span></div>
    <p>{siteConfig.supportHours}. No private home address is published.</p>
  </aside><div><p className="eyebrow">Send a message</p><h2>How can we help?</h2><ContactForm /></div></div></div>;
}
