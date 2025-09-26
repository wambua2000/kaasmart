import LoginForm, { UserRole } from "@/components/auth/LoginForm";

interface LoginProps {
  onLogin: (email: string, role: UserRole) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  return <LoginForm onLogin={onLogin} />;
};

export default Login;