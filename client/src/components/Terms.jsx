import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

function Terms({ title }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="link">{title || 'Open Terms'}</Button>
            </DialogTrigger>

            <DialogContent className="max-w-[350px] sm:max-w-[700px] p-10">
                <DialogHeader >
                    <DialogTitle>Terms of Use</DialogTitle>
                    <DialogDescription>
                        Your Agreement for Using the S-Bin Smart Waste-Management Platform
                    </DialogDescription>
                </DialogHeader>

                <div className="overflow-scroll max-h-[40vh] text-sm sm:text-base sm:max-h-[60vh] space-y-6">
                    <section>
                        <h3>1. Introduction</h3>
                        <p>
                            Welcome to S-Bin, the smart waste-management solution. These
                            Terms of Use (“Terms”) govern your access to and use of the
                            S-Bin website, platform, and any related services (collectively,
                            the “Services”). By accessing or using our Services, you agree
                            to be bound by these Terms.
                        </p>
                    </section>

                    <section>
                        <h3>2. Services</h3>
                        <p>
                            S-Bin provides technology for monitoring and managing waste bins,
                            including sensors, communication modules, a management platform,
                            and (if applicable) a mobile application. The Services may
                            include real-time fill-level monitoring, notifications, reports,
                            and integration with third-party platforms.
                        </p>
                    </section>

                    <section>
                        <h3>3. Eligibility</h3>
                        <p>
                            You must be at least 18 years old or have the legal authority of
                            your organization to use the Services. By using the Services on
                            behalf of an entity, you represent that you are authorized to
                            bind that entity to these Terms.
                        </p>
                    </section>

                    <section>
                        <h3>4. Accounts and Access</h3>
                        <ul>
                            <li>
                                Some parts of the Services may require you to create an
                                account.
                            </li>
                            <li>
                                You agree to provide accurate and complete information and to
                                keep your credentials secure.
                            </li>
                            <li>You are responsible for all activity under your account.</li>
                        </ul>
                    </section>

                    <section>
                        <h3>5. Acceptable Use</h3>
                        <p>You agree not to:</p>
                        <ul>
                            <li>Use the Services in any way that violates applicable laws or regulations.</li>
                            <li>Interfere with or disrupt the Services or the networks connected to them.</li>
                            <li>Attempt to gain unauthorized access to any part of the Services or to other users’ data.</li>
                        </ul>
                    </section>

                    <section>
                        <h3>6. Data and Privacy</h3>
                        <p>
                            S-Bin collects and processes data about bin fill levels,
                            location, and usage to provide the Services. We take privacy and
                            data security seriously and implement reasonable measures to
                            protect the information we collect. By using the Services, you
                            consent to our collection and use of data as described in our
                            Privacy Policy.
                        </p>
                    </section>

                    <section>
                        <h3>7. Intellectual Property</h3>
                        <p>
                            All content, software, and technology in the Services (including
                            the S-Bin name, logo, and related trademarks) are owned by or
                            licensed to us and are protected by intellectual property laws.
                            You are granted a limited, non-exclusive, non-transferable
                            license to use the Services for their intended purpose.
                        </p>
                    </section>

                    <section>
                        <h3>8. Third-Party Services and Integrations</h3>
                        <p>
                            Our Services may integrate with third-party platforms or
                            networks (e.g., municipal systems, IoT platforms). We are not
                            responsible for the actions or policies of those third parties.
                        </p>
                    </section>

                    <section>
                        <h3>9. Disclaimers</h3>
                        <p>
                            The Services are provided “as is” and “as available.” We do not
                            warrant that the Services will be uninterrupted, error-free, or
                            completely accurate. You use the Services at your own risk.
                        </p>
                    </section>

                    <section>
                        <h3>10. Limitation of Liability</h3>
                        <p>
                            To the fullest extent permitted by law, S-Bin and its affiliates
                            will not be liable for any indirect, incidental, consequential,
                            or punitive damages arising from your use of the Services.
                        </p>
                    </section>

                    <section>
                        <h3>11. Changes to the Services and Terms</h3>
                        <p>
                            We may update or modify the Services at any time. We may also
                            update these Terms from time to time. The latest version will be
                            posted on our website. Continued use of the Services after
                            changes means you accept the updated Terms.
                        </p>
                    </section>

                    <section>
                        <h3>12. Termination</h3>
                        <p>
                            We may suspend or terminate your access to the Services if you
                            violate these Terms or if required by law. Upon termination,
                            your right to use the Services will cease immediately.
                        </p>
                    </section>
                </div>

                <DialogFooter className="p-6">
                    <DialogClose asChild>
                        <Button>Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default Terms
