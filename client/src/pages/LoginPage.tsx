import '../App.css'
import LoginForm from '../components/login-form'

function LoginPage() {
  return (
    <>
        <div className="flex h-full w-full items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
    </>
  );
}

export default LoginPage