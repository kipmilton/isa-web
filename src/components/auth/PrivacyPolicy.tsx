interface PrivacyPolicyProps {
  userType: 'customer' | 'vendor';
}

export default function PrivacyPolicy({ userType }: PrivacyPolicyProps) {
  if (userType === 'vendor') {
    return (
      <div className="space-y-4 text-sm leading-relaxed">
        <div>
          <h3 className="text-lg font-semibold">Vendor Privacy Policy – ISA AI Shopping Assistant</h3>
          <p><strong>Effective Date:</strong> 7/17/2025</p>
          <p><strong>Version:</strong> 1.0</p>
        </div>

        <p>
          ISA AI Shopping Assistant Ltd. ("ISA", "we", "our", "us") is committed to protecting the privacy of vendors ("you", "your") who use our platform. This Privacy Policy explains how we collect, use, and protect Vendor data during the onboarding process and while using the ISA platform.
        </p>

        <h4 className="text-base font-semibold mt-4">1. Information We Collect</h4>
        <p>During onboarding and account setup, we may collect:</p>
        <ul className="list-disc ml-6 space-y-1">
          <li>Business registration documents (Certificate of Incorporation/Business Permit)</li>
          <li>Business identifiers (KRA PIN, Tax IDs, registration numbers)</li>
          <li>Owner or representative details (full name, ID/passport, phone, email)</li>
          <li>Business address and operational location</li>
          <li>Payment details (bank/Mpesa numbers, settlement accounts)</li>
          <li>Product and category information (for listings)</li>
        </ul>

        <h4 className="text-base font-semibold mt-4">2. Purpose of Collection</h4>
        <p>We collect Vendor data to:</p>
        <ul className="list-disc ml-6 space-y-1">
          <li>Verify your identity and eligibility as a Vendor</li>
          <li>Comply with tax and regulatory obligations</li>
          <li>Facilitate payments and settlements</li>
          <li>Manage product listings and transactions</li>
          <li>Prevent fraud and misuse of the ISA platform</li>
          <li>Provide support and communicate updates</li>
        </ul>

        <h4 className="text-base font-semibold mt-4">3. Data Sharing</h4>
        <p><strong>Internal Use:</strong> Data is accessible only to ISA's authorized staff.</p>
        <p><strong>Third-Party Services:</strong> We may share payment details with financial institutions, regulators, or service providers (e.g., payment processors, courier partners).</p>
        <p><strong>Legal Requirements:</strong> We may disclose Vendor data if required by law or regulatory authorities.</p>

        <h4 className="text-base font-semibold mt-4">4. Data Security</h4>
        <p>
          We use encryption, secure servers, and restricted access controls to safeguard Vendor information. However, no system is 100% secure, and Vendors are advised to maintain confidentiality of their login credentials.
        </p>

        <h4 className="text-base font-semibold mt-4">5. Data Retention</h4>
        <p>
          Vendor data will be retained as long as the Vendor maintains an account with ISA, or as required by law (e.g., tax records). Upon account termination, ISA may retain certain records for compliance.
        </p>

        <h4 className="text-base font-semibold mt-4">6. Vendor Rights</h4>
        <p>Vendors have the right to:</p>
        <ul className="list-disc ml-6 space-y-1">
          <li>Access their stored data</li>
          <li>Request corrections to inaccurate data</li>
          <li>Request deletion of data (subject to regulatory obligations)</li>
          <li>Withdraw consent to non-essential data use</li>
        </ul>

        <h4 className="text-base font-semibold mt-4">7. Contact</h4>
        <p>For privacy inquiries, email: <a href="mailto:isashoppingai@gmail.com" className="text-blue-600 hover:underline">isashoppingai@gmail.com</a></p>
      </div>
    );
  }

  // Customer Privacy Policy
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      <div>
        <h3 className="text-lg font-semibold">Customer Privacy Policy – ISA AI Shopping Assistant</h3>
        <p><strong>Effective Date:</strong> 7/17/2025</p>
        <p><strong>Version:</strong> 1.0</p>
      </div>

      <p>
        ISA AI Shopping Assistant Ltd. ("ISA", "we", "our", "us") values your privacy. This Privacy Policy explains how we collect, use, and protect the personal data of customers ("you", "your") using our mobile app, website, or AI shopping services.
      </p>

      <h4 className="text-base font-semibold mt-4">1. Information We Collect</h4>
      <p>When you use ISA, we may collect:</p>
      <ul className="list-disc ml-6 space-y-1">
        <li>Personal details: full name, date of birth, gender</li>
        <li>Contact details: phone number, email address</li>
        <li>Location data (city, delivery address, GPS where enabled)</li>
        <li>Account details (login credentials, preferences)</li>
        <li>Shopping activity (browsing history, saved items, purchases)</li>
        <li>Payment details (mobile money, card, or wallet info – processed via secure gateways)</li>
      </ul>

      <h4 className="text-base font-semibold mt-4">2. Purpose of Collection</h4>
      <p>We use Customer data to:</p>
      <ul className="list-disc ml-6 space-y-1">
        <li>Provide personalized shopping recommendations</li>
        <li>Facilitate orders, payments, and deliveries</li>
        <li>Verify identity and prevent fraudulent activity</li>
        <li>Communicate updates, offers, and support messages</li>
        <li>Improve ISA's AI recommendations and shopping experience</li>
        <li>Comply with legal and tax requirements</li>
      </ul>

      <h4 className="text-base font-semibold mt-4">3. Data Sharing</h4>
      <p><strong>Vendors:</strong> Limited customer data (e.g., name, contact, delivery address) may be shared with Vendors or couriers for order fulfillment.</p>
      <p><strong>Third-Party Services:</strong> Payment processors, analytics providers, or delivery partners may receive data necessary to provide their services.</p>
      <p><strong>Legal Requirements:</strong> We may disclose customer data to law enforcement or regulators when required.</p>

      <h4 className="text-base font-semibold mt-4">4. Data Security</h4>
      <p>
        We use industry-standard encryption, secure servers, and access restrictions to protect your data. However, you are responsible for safeguarding your account login details.
      </p>

      <h4 className="text-base font-semibold mt-4">5. Data Retention</h4>
      <p>
        Customer data is stored as long as you maintain an ISA account. Upon account closure, certain data may still be retained to meet legal obligations (e.g., tax, fraud prevention).
      </p>

      <h4 className="text-base font-semibold mt-4">6. Customer Rights</h4>
      <p>You have the right to:</p>
      <ul className="list-disc ml-6 space-y-1">
        <li>Access your personal data</li>
        <li>Request correction of inaccurate information</li>
        <li>Request deletion of your account and associated data (subject to legal obligations)</li>
        <li>Opt-out of marketing communications at any time</li>
      </ul>

      <h4 className="text-base font-semibold mt-4">7. Children's Data</h4>
      <p>ISA is not intended for children under 18 without parental/guardian consent.</p>

      <h4 className="text-base font-semibold mt-4">8. Contact</h4>
      <p>For privacy inquiries, email: <a href="mailto:isashoppingai@gmail.com" className="text-blue-600 hover:underline">isashoppingai@gmail.com</a></p>
    </div>
  );
}
