import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Credentials {
  email: string;
  password: string;
}

interface CredentialsDisplayProps {
  credentials: Credentials;
  propertyName: string;
  onClose: () => void;
}

export function CredentialsDisplay({ credentials, propertyName, onClose }: CredentialsDisplayProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Copied!",
        description: `${field} copied to clipboard`,
      });
      
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const copyAllCredentials = async () => {
    const credentialsText = `KaaSmart Manager Login Credentials for ${propertyName}

Email: ${credentials.email}
Password: ${credentials.password}

Please use these credentials to sign in to your manager account.`;

    try {
      await navigator.clipboard.writeText(credentialsText);
      toast({
        title: "All Credentials Copied!",
        description: "Full login details copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy credentials",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-green-600" />
        </div>
        <CardTitle className="text-xl text-center">Manager Invitation Sent!</CardTitle>
        <p className="text-sm text-muted-foreground">
          Login credentials have been generated for <strong>{propertyName}</strong>
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="flex gap-2">
            <Input 
              id="email"
              value={credentials.email} 
              readOnly 
              className="font-mono text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(credentials.email, "Email")}
              className="flex-shrink-0"
            >
              {copiedField === "Email" ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Temporary Password</Label>
          <div className="flex gap-2">
            <Input 
              id="password"
              value={credentials.password} 
              readOnly 
              className="font-mono text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(credentials.password, "Password")}
              className="flex-shrink-0"
            >
              {copiedField === "Password" ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <h4 className="font-medium text-blue-900 mb-2">Important Notes:</h4>
          <ul className="text-blue-800 space-y-1 text-xs">
            <li>• An invitation email has been sent to the manager</li>
            <li>• These credentials will work immediately</li>
            <li>• The manager can change their password after first login</li>
            <li>• Share these credentials securely with the manager</li>
          </ul>
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={copyAllCredentials}
            className="flex-1"
            variant="outline"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy All Credentials
          </Button>
          <Button onClick={onClose} className="flex-1">
            Done
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}