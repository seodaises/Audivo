import { AppBar, Toolbar, Box, Typography, IconButton, Stack, Menu, MenuItem, Button, Chip } from '@mui/material';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useColorMode } from '../../context/ColorModeContext';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { mode, toggle } = useColorMode();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);

  const handleLogout = () => { setAnchor(null); logout(); navigate('/login'); };

  return (
    <AppBar position="fixed" elevation={0} color="default"
      sx={{
        zIndex: (t) => t.zIndex.drawer + 1, // sit ABOVE the sidebar
        borderBottom: 1, borderColor: 'divider', backdropFilter: 'blur(8px)',
        bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(18,18,18,0.8)' : 'rgba(255,255,255,0.8)'),
      }}>
      <Toolbar sx={{ gap: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <MusicNoteRoundedIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Audivo</Typography>
        </Stack>

        <Box sx={{ flexGrow: 1 }} />

        <IconButton onClick={toggle} color="inherit" aria-label="toggle day/night mode">
          {mode === 'dark' ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
        </IconButton>

        {user ? (
          <>
            <Chip label={user.role} color="primary" variant="outlined" size="small"
              sx={{ mr: 0.5, display: { xs: 'none', sm: 'flex' } }} />
            <IconButton onClick={(e) => setAnchor(e.currentTarget)} color="inherit" aria-label="account menu">
              <MoreVertRoundedIcon />
            </IconButton>
            <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
              <MenuItem onClick={() => { setAnchor(null); navigate('/change-password'); }}>
                <LockResetRoundedIcon fontSize="small" sx={{ mr: 1 }} /> Change password
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutRoundedIcon fontSize="small" sx={{ mr: 1 }} /> Log out
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Button variant="contained" color="primary" disableElevation onClick={() => navigate('/login')}>
            Log in
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}