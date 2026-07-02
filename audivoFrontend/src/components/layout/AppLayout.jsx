import { Box, Container, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header />
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
        <Toolbar /> {/* offsets the fixed header */}
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Outlet /> {/* the current page renders here */}
        </Container>
      </Box>
    </Box>
  );
}