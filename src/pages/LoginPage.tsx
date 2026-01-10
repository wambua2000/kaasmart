import LoginForm, { UserRole } from "@/components/auth/LoginForm";
import modernApartmentsLogin from "@/assets/modern-apartments-login.jpg";

interface LoginPageProps {
  onLogin: (email: string, role: UserRole) => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${modernApartmentsLogin})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
        <LoginForm onLogin={onLogin} />
      </div>
    </div>
  );
};

export default LoginPage;
