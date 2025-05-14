import { Link } from 'react-router';
import './App.css'
import { Button } from './components/ui/button';
import { useContext, useEffect } from 'react';
import AuthContext from './context/AuthProvider';
import { useNavigate } from 'react-router';

function App() {

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user.id) {
      navigate('/home', { replace: true });
    }
  }
  , [user.id, navigate]);

  return (
    <div className='flex flex-col items-center justify-center space-y-4 text-center fixed right-0.5 top-0.5 left-0.5 bottom-0.5 p-6 md:p-10'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none'>
            Witaj w HPEChat
          </h1>
          <p className='mx-auto max-w-[700px] md:text-xl'>
            Prywatny i darmowy
          </p>
          <Link to='/login'>
            <Button>Zaloguj się</Button>
          </Link>
        </div>
    </div>
  );
}

export default App
