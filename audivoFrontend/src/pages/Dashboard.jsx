import { Box, Typography, Chip, Stack, Paper, Button, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../auth/permissions';
import GreetingHeader from '../components/GreetingHeader';
import MediaCard from '../components/MediaCard';
import Shelf from '../components/Shelfs';
import { quickPicks, recentlyPlayed, madeForYou } from '../data/placeholders';

export default function Dashboard() {
  const { user, can } = useAuth();

  return (
    <Box>
      <GreetingHeader />
      <Shelf title="Quick picks" items={quickPicks} />
      <Shelf title="Recently played" items={recentlyPlayed} />
      <Shelf title="Made for you" items={madeForYou} />
    </Box>
  );
}