import { useState } from 'react';
import { Box, Paper, Typography, Stack, TextField, Button, Alert } from '@mui/material';
import { api } from '../api/client';

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(false);

  const handleSubmit = async () => {
    setErr(null); setOk(false);
    if (newPassword.length < 8) return setErr('New password must be at least 8 characters.');
    if (newPassword !== confirm) return setErr('New passwords do not match.');
    if (newPassword === oldPassword) return setErr('New password must differ from the current one.');
    setLoading(true);
    try {
      await api('/auth/change-password', { method: 'POST', body: { oldPassword, newPassword } });
      setOk(true);
      setOldPassword(''); setNewPassword(''); setConfirm('');
    } catch (e) { setErr(e.message); } // e.g. "Current password is incorrect"
    finally { setLoading(false); }
  };

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>Change password</Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        {ok && <Alert severity="success" sx={{ mb: 2 }}>Password changed successfully.</Alert>}
        <Stack spacing={2}>
          <TextField label="Current password" type="password" fullWidth value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)} />
          <TextField label="New password" type="password" fullWidth value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} />
          <TextField label="Confirm new password" type="password" fullWidth value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
          <Button variant="contained" disableElevation onClick={handleSubmit}
            disabled={loading} sx={{ alignSelf: 'flex-start' }}>
            {loading ? 'Saving…' : 'Update password'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}