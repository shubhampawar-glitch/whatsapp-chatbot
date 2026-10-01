import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Law Firm WhatsApp Assistant",
  description: "Privacy policy for the law firm WhatsApp assistant.",
};

export default function PrivacyPage() {
  return (
    <main className="privacy-page">
      <article className="privacy-card">
        <div className="privacy-brand">
          <span className="privacy-brand-mark">L</span>
          <span>Law Firm WhatsApp Assistant</span>
        </div>

        <header className="privacy-header">
          <p className="privacy-eyebrow">LEGAL INFORMATION</p>
          <h1>Privacy Policy</h1>
          <p className="privacy-updated">Last updated: October 1, 2026</p>
        </header>

        <div className="privacy-content">
          <p>
            This Privacy Policy explains how the law firm WhatsApp assistant
            handles information when you contact us through WhatsApp. We aim to
            keep the service simple, useful, and respectful of your privacy.
          </p>

          <section>
            <h2>Information we process</h2>
            <p>
              When you message us, the service may process your WhatsApp
              profile information, phone number, message content, and the date
              and time of your messages. We use this information only as
              reasonably necessary to communicate with you and provide the
              requested support.
            </p>
          </section>

          <section>
            <h2>How the chatbot works</h2>
            <p>
              The service may process WhatsApp messages to provide automated
              responses, understand the general nature of your enquiry, answer
              basic questions, and help connect you with a lawyer or request a
              consultation.
            </p>
            <p>
              Messages may be processed by third-party artificial intelligence
              services when necessary to generate responses. These services
              process information on our behalf and are expected to protect it
              according to their applicable terms and privacy practices.
            </p>
          </section>

          <section>
            <h2>Legal information and consultations</h2>
            <p>
              The chatbot provides general information and is not a lawyer. It
              does not provide definitive legal advice, guarantee an outcome,
              or create an attorney-client relationship. For complex, urgent,
              or confidential matters, please speak directly with a qualified
              lawyer.
            </p>
            <p>
              If you request a consultation, we may ask for your name, the type
              of legal issue, and your preferred date and time so that a member
              of the firm can follow up.
            </p>
          </section>

          <section>
            <h2>Information we do not need</h2>
            <p>
              Please do not send passwords, payment card numbers, government
              identification numbers, or other unnecessary sensitive
              information through the chatbot. We do not intentionally collect
              personal information that is not needed to respond to your
              enquiry or arrange contact with the firm.
            </p>
          </section>

          <section>
            <h2>Sharing and retention</h2>
            <p>
              We may share message information with service providers that
              help operate WhatsApp messaging, deliver the chatbot, or support
              the firm&apos;s communications. We do not sell your personal
              information. Information is retained only for as long as
              reasonably necessary for the purposes described in this policy,
              legal obligations, and business recordkeeping.
            </p>
          </section>

          <section>
            <h2>Your choices</h2>
            <p>
              You may stop using the chatbot at any time. You may also contact
              us to ask about the information we hold about your conversation,
              subject to applicable legal and operational requirements.
            </p>
          </section>

          <section className="privacy-contact">
            <h2>Contact us</h2>
            <p>
              If you have questions about this Privacy Policy or how your
              information is handled, contact us at{" "}
              <a href="mailto:privacy@example.com">privacy@example.com</a>.
              Replace this placeholder email with your firm&apos;s preferred
              contact address.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
