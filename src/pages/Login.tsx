import LoginForm, { UserRole } from "@/components/auth/LoginForm";
import kaasmartLogo from "@/assets/kaasmart-logo.png";

interface LoginProps {
  onLogin: (email: string, role: UserRole) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      {/* Logo at top of login form */}
      <div className="mb-8">
        <img 
          src={kaasmartLogo} 
          alt="KaaSmart Logo" 
          className="h-20 w-auto mx-auto"
        />
      </div>
      <LoginForm onLogin={onLogin} />
    </div>
  );
};

export default Login;