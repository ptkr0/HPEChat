import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useContext, useState } from "react"
import AuthContext from "@/context/AuthProvider"
import { useNavigate } from "react-router"
import { userService } from "@/services/userService"
import { useAppStore } from "@/stores/appStore"

const LoginForm = () => {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const clearStore = useAppStore((state) => state.clearStore);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await userService.login(username, password);

      setUser({id: response.id, username: response.username, role: response.role, image: response.image || '', blobImage: ''});
      clearStore();
      navigate("/home", { replace: true });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (err: any) {
      if(err.response?.status === 400) {
        toast.error("Błędne dane logowania");
      }
      else if (err.response?.status === 500) {
        toast.error("Błąd serwera");
      }
    }
      
  }

  return (
    <div className={cn("flex flex-col gap-6",)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Logowanie</CardTitle>
          <CardDescription>
            Zaloguj się przy pomocy nazwy użytkownika i hasła
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">Nazwa użytkownika</Label>
                <Input
                  id="username"
                  type="text"
                  required
                  value={username} 
                  onChange={(e)=> setUsername(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Hasło</Label>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e)=> setPassword(e.target.value)} 
                  required />
              </div>
              <Button type="submit" className="w-full" disabled={!username || !password}>
                Zaloguj
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Nie masz konta?{" "}
              <a className="underline underline-offset-4 cursor-pointer"
                  onClick={() =>
                    toast.info("Zarejestrować cię może tylko administator", {
                    })
                  }
                >
                Zarejestruj się
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
};

export default LoginForm;
