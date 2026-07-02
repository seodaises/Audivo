import { useState } from 'react';
import { Box, Card, CardContent, Typography, Stack, TextField, Button, Alert, Link } from '@mui/material';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register, resendVerification, error, loading } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState(null);
  const [submitted, setSubmitted] = useState(false); // → show "check your email"
  const [resent, setResent] = useState(false);

  const handleSubmit = async () => {
    setLocalError(null);
    if (password.length < 8) return setLocalError('Password must be at least 8 characters.');
    if (password !== confirm) return setLocalError('Passwords do not match.');
    const ok = await register(displayName, email, password);
    if (ok) setSubmitted(true);
  };

  const handleResend = async () => {
    const ok = await resendVerification(email);
    if (ok) setResent(true);
  };

  // --- Confirmation screen: account created, verification email sent ---
  if (submitted) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
        <Card sx={{ maxWidth: 460, width: '100%' }} elevation={3}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <MarkEmailReadRoundedIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Check your email</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              We sent a verification link to <strong>{email}</strong>. Click it to activate
              your account, then log in.
            </Typography>

            {resent && <Alert severity="success" sx={{ mb: 2 }}>Verification email re-sent.</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Stack spacing={1.5}>
              <Button variant="contained" size="large" disableElevation onClick={() => navigate('/login')}>
                Go to login
              </Button>
              <Button variant="text" onClick={handleResend} disabled={loading}>
                Didn’t get it? Resend email
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // --- Registration form ---
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