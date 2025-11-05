import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Shield, Mail, Lock, CheckCircle, ArrowLeft, AlertTriangle } from "lucide-react";

const ForgotPassword = () => {
  const { sendPasswordResetEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
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
    window.history.back();
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background to-muted/20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">Reset Password</h1>
            <p className="text-muted-foreground mt-2">
              Enter your email to receive a password reset link
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Shield className="h-6 w-6 text-pal-blue" />
                <span className="text-lg font-semibold">Secure Password Reset</span>
              </div>
            </CardHeader>
            <CardContent>
              {!isEmailSent ? (
                <form onSubmit={handleSendResetEmail} className="space-y-4">
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>How it works:</strong> Enter your email address and we'll send you a secure link to reset your password.
                    </AlertDescription>
                  </Alert>

                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-sm text-red-800">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        className="pl-10"
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
                    className="w-full primary-gradient hover:shadow-glow transition-spring"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground">
                    Check Your Email
                  </h3>
                  
                  <p className="text-muted-foreground">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>

                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-sm text-green-800">
                      <strong>Next steps:</strong>
                      <ol className="mt-2 list-decimal list-inside space-y-1">
                        <li>Check your email inbox (and spam folder)</li>
                        <li>Click the "Reset Password" link in the email</li>
                        <li>Create a new secure password</li>
                        <li>Sign in with your new password</li>
                      </ol>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3 pt-4">
                    <Button 
                      onClick={handleSendResetEmail}
                      variant="outline" 
                      className="w-full"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Resend Email
                    </Button>
                    
                    <Button 
                      onClick={handleBackToSignIn}
                      variant="ghost" 
                      className="w-full"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Sign In
                    </Button>
                  </div>
                </div>
              )}

              <Separator className="my-6" />
              
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  Remember your password?{" "}
                  <Link to="/signin" className="text-pal-blue hover:underline">
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
