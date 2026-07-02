import { useState } from 'react';
import { Box, Card, CardContent, Typography, Stack, TextField, Button, Alert, Link } from '@mui/material';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register, error, loading } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async () => {
    setLocalError(null);
    if (password.length < 8) return setLocalError('Password must be at least 8 characters.');
    if (password !== confirm) return setLocalError('Passwords do not match.');
    const ok = await register(displayName, email, password);
    if (ok) navigate('/');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Card sx={{ maxWidth: 420, width: '100%' }} elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center" sx={{ mb: 1 }}>
            <MusicNoteRoundedIcon color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Audivo</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Create your account
          </Typography>

          {(localError || error) && <Alert severity="error" sx={{ mb: 2 }}>{localError || error}</Alert>}

          <Stack spacing={2}>
            <TextField label="Display name" fullWidth value={displayName}
              onChange={(e) => setDisplayName(e.target.value)} />
            <TextField label="Email" type="email" fullWidth value={email}
              onChange={(e) => setEmail(e.target.value)} />
            <TextField label="Password" type="password" fullWidth value={password}
              onChange={(e) => setPassword(e.target.value)} />
            <TextField label="Confirm password" type="password" fullWidth value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
            <Button variant="contained" size="large" disableElevation
              onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating account…' : 'Sign up'}
            </Button>
          </Stack>

          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Already have an account? <Link component={RouterLink} to="/login">Log in</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}