import { Redirect } from 'expo-router';

// Entry point — hands off immediately to the auth gate.
// Phase 2: replace with a session-aware redirect:
//   const { session } = useSession();
//   return <Redirect href={session ? '/(app)/(home)' : '/(auth)'} />;
export default function Index() {
  return <Redirect href="/(auth)" />;
}
