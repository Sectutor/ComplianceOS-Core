import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

            <section>
              <h3 className="text-xl font-semibold mb-2">1. Introduction</h3>
              <p>
                Welcome to ComplianceOS ("we," "our," or "us"). We are committed to protecting your personal data and respecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
                We comply with the General Data Protection Regulation (GDPR) and other applicable data protection laws.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-2">2. Data We Collect</h3>
              <p>We may collect and process the following data about you:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Identity Data:</strong> Name, username, or similar identifier.</li>
                <li><strong>Contact Data:</strong> Email address and telephone number.</li>
                <li><strong>Technical Data:</strong> Internet protocol (IP) address, login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
                <li><strong>Usage Data:</strong> Information about how you use our website, products, and services.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-2">3. How We Use Your Data</h3>
              <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                <li>Where we need to comply with a legal obligation.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-2">4. Data Security</h3>
              <p>
                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed.
                In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-2">5. Your Legal Rights</h3>
              <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Request access to your personal data.</li>
                <li>Request correction of your personal data.</li>
                <li>Request erasure of your personal data.</li>
                <li>Object to processing of your personal data.</li>
                <li>Request restriction of processing your personal data.</li>
                <li>Request transfer of your personal data.</li>
                <li>Right to withdraw consent.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-2">6. Contact Us</h3>
              <p>
                If you have any questions about this privacy policy or our privacy practices, please contact us at: support@complianceos.com
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
