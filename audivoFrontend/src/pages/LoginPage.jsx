import { useState } from 'react';
import { Box, Card, CardContent, Typography, Stack, TextField, Button, Alert, Link } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    const ok = await login(email, password);
    if (ok) navigate('/');
  };

  return (
    <Box sx={{display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh",}}> 
      <Card sx={{ maxWidth: 400, width: '100%' }} elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center" sx={{ mb: 3 }}>
            <MusicNoteRoundedIcon color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Audivo</Typography>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Stack spacing={2}>
            <TextField label="Email" type="email" fullWidth value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
            <TextField label="Password" type="password" fullWidth value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
            <Button variant="contained" size="large" disableElevation
              onClick={handleSubmit} disabled={loading}>
              {loading ? 'Signing in…' : 'Log in'}
            </Button>
          </Stack>
<Stack spacing={0.5} sx={{ mt: 2 }} alignItems="center">
  <Link component={RouterLink} to="/forgot-password" variant="body2">Forgot password?</Link>
  <Typography variant="body2">
    No account? <Link component={RouterLink} to="/register">Sign up</Link>
  </Typography>
</Stack>
        </CardContent>
      </Card>
    </Box>
  );
}