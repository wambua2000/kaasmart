import LoginForm from "@/components/auth/LoginForm";
import africanApartmentComplex from "@/assets/african-apartment-complex.jpg";

const Login = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${africanApartmentComplex})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;