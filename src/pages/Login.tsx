import LoginForm, { UserRole } from "@/components/auth/LoginForm";
import africanApartmentComplex from "@/assets/african-apartment-complex.jpg";
import kaasmartLogo from "@/assets/kaasmart-logo.png";

interface LoginProps {
  onLogin: (email: string, role: UserRole) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${africanApartmentComplex})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      {/* Logo */}
      <div className="absolute top-8 left-8 z-20">
        <img 
          src={kaasmartLogo} 
          alt="KaaSmart Logo" 
          className="h-16 w-auto"
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <LoginForm onLogin={onLogin} />
      </div>
    </div>
  );
};

export default Login;