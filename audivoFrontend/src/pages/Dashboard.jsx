import { Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import GreetingHeader from '../components/GreetingHeader';
import Shelf from '../components/Shelfs';
import { quickPicks, recentlyPlayed, madeForYou } from '../data/placeholders';
import AdminDashboard from './AdminDashboard';

// Staff (Admin = 4, Super Admin = 5) get the admin overview; everyone else
// (Listener / Artist / Moderator) keeps the music experience.
const STAFF_LEVEL = 4;

export default function Dashboard() {
  const { user } = useAuth();

  if ((user?.level ?? 0) >= STAFF_LEVEL) {
    return <AdminDashboard />;
  }

  return (
    <Box>
      <GreetingHeader />
      <Shelf title="Quick picks" items={quickPicks} />
      <Shelf title="Recently played" items={recentlyPlayed} />
      <Shelf title="Made for you" items={madeForYou} />
    </Box>
  );
}