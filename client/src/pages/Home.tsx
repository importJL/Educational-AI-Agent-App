import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Streamdown } from 'streamdown';

export default function Home() {
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh" }}>
      <main className="container" style={{ padding: "2rem" }}>
        <div className="preloader-wrapper small active">
          <div className="spinner-layer spinner-blue-only">
            <div className="circle-clipper left"><div className="circle" /></div>
            <div className="gap-patch"><div className="circle" /></div>
            <div className="circle-clipper right"><div className="circle" /></div>
          </div>
        </div>
        Example Page
        <Streamdown>Any **markdown** content</Streamdown>
        <button className="btn">Example Button</button>
      </main>
    </div>
  );
}
