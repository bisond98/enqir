import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, CheckCircle, ArrowLeft, AlertTriangle, Check } from "lucide-react";

const ForgotPassword = () => {
  const { sendPasswordResetEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSendResetEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await sendPasswordResetEmail(email);
      
      if (!result.error) {
        setIsEmailSent(true);
        setSuccess("Password reset email sent successfully! Check your inbox.");
      } else {
        setError(result.error.message || "Failed to send reset email");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    navigate("/signin");
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12 bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-pal-blue/5 rounded-full animate-float hidden sm:block"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-pal-blue/10 rounded-full animate-float hidden sm:block" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-32 left-1/4 w-16 h-16 bg-pal-blue/5 rounded-full animate-float hidden sm:block" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Header Section */}
          <div className="text-center mb-5 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-pal-blue/10 to-pal-blue/5 mb-3 sm:mb-6">
              <Lock className="h-7 w-7 sm:h-10 sm:w-10 text-pal-blue" />
            </div>
            <h1 className="text-xl sm:text-3xl font-bold text-foreground mb-2 sm:mb-3">
              Reset Password
            </h1>
            <p className="text-xs sm:text-base text-muted-foreground px-2">
              Enter your email to receive a password reset link
            </p>
          </div>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6 sm:pb-8">
              {!isEmailSent ? (
                <form onSubmit={handleSendResetEmail} className="space-y-4 sm:space-y-5">
                  {error && (
                    <Alert className="border-red-200 bg-red-50/80">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-xs sm:text-sm text-red-800">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-foreground">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        className="pl-10 h-11 text-sm border-gray-200 focus:border-pal-blue focus:ring-pal-blue/20"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      We'll send a password reset link to this email
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 text-sm font-semibold primary-gradient hover:shadow-glow transition-spring"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Reset Link
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="text-center space-y-4 sm:space-y-6">
                  {/* Success Icon */}
                  <div className="flex justify-center">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center mx-auto shadow-lg">
                      <CheckCircle className="h-7 w-7 sm:h-10 sm:w-10 text-green-600" />
                    </div>
                  </div>
                  
                  {/* Title */}
                  <div>
                    <h3 className="text-lg sm:text-2xl font-bold text-foreground mb-2">
                    Check Your Email
                  </h3>
                    <p className="text-xs sm:text-base text-muted-foreground px-1">
                      We've sent a password reset link to{" "}
                      <span className="font-semibold text-foreground break-all">{email}</span>
                  </p>
                  </div>

                  {/* Next Steps */}
                  <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-lg p-3 sm:p-5 border border-blue-100">
                    <p className="text-xs sm:text-base font-semibold text-foreground mb-2.5 sm:mb-4 text-left">
                      Next steps:
                    </p>
                    <ul className="space-y-2 sm:space-y-3 text-left">
                      <li className="flex items-start gap-2.5 sm:gap-3">
                        <div className="flex-shrink-0 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-pal-blue/10 flex items-center justify-center mt-0.5">
                          <Check className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-pal-blue" />
                        </div>
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          Check your email inbox (and spam folder)
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5 sm:gap-3">
                        <div className="flex-shrink-0 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-pal-blue/10 flex items-center justify-center mt-0.5">
                          <Check className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-pal-blue" />
                        </div>
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          Click the "Reset Password" link in the email
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5 sm:gap-3">
                        <div className="flex-shrink-0 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-pal-blue/10 flex items-center justify-center mt-0.5">
                          <Check className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-pal-blue" />
                        </div>
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          Create a new secure password
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5 sm:gap-3">
                        <div className="flex-shrink-0 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-pal-blue/10 flex items-center justify-center mt-0.5">
                          <Check className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-pal-blue" />
                        </div>
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          Sign in with your new password
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2.5 sm:space-y-3 pt-1">
                    <Button 
                      onClick={() => handleSendResetEmail()}
                      variant="outline" 
                      className="w-full h-11 text-sm border-2 hover:bg-pal-blue/5 hover:border-pal-blue transition-spring"
                      disabled={loading}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Resend Email
                    </Button>
                    
                    <Button 
                      onClick={handleBackToSignIn}
                      variant="ghost" 
                      className="w-full h-11 text-sm hover:bg-muted/50 transition-spring"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Sign In
                    </Button>
                  </div>
                </div>
              )}

              <Separator className="my-4 sm:my-6" />
              
              {/* Footer Link */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Remember your password?{" "}
                  <Link 
                    to="/signin" 
                    className="font-semibold text-pal-blue hover:text-pal-blue/80 hover:underline transition-colors"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ForgotPassword;
