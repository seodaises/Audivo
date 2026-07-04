import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Stack, Button, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Select, MenuItem, Alert, Skeleton, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, Divider,
  IconButton, InputAdornment,
} from '@mui/material';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ROLE_LEVEL = {
  'Super Admin': 5, 'Admin': 4, 'Moderator': 3, 'Artist': 2, 'Listener': 1,
};

// Roles a Super Admin may ASSIGN via this dashboard — capped at Admin and below
// (Super Admin stays a rare, manual grant). Mirrors the backend's MAX_ASSIGNABLE_LEVEL.
const ASSIGNABLE_ROLES = ['Admin', 'Moderator', 'Artist', 'Listener'];

export default function ManageRolesPage() {
  const { user: me } = useAuth();
  const myLevel = ROLE_LEVEL[me?.role] ?? 0;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [toast, setToast] = useState('');

  // +Add Admin dialog state
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const { data } = await api('/admin/users?page=1&limit=100');
      setRows(data.users);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeRole = async (targetUser, newRole) => {
    setSavingId(targetUser.id); setErr(null);
    try {
      await api(`/admin/users/${targetUser.id}/role`, { method: 'PATCH', body: { role: newRole } });
      setToast(`@${targetUser.username} is now ${newRole}`);
      await load(); // re-pull so the table reflects the new state
    } catch (e) {
      setErr(e.message); // e.g. "You cannot change your own role"
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 1 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Manage roles</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Promote or demote users. You can only change roles below your own level.
          </Typography>
        </Box>
        <Button
          variant="contained" disableElevation startIcon={<PersonAddRoundedIcon />}
          onClick={() => setAddOpen(true)}
          sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          Add admin
        </Button>
      </Stack>

      {err && <Alert severity="error" sx={{ mb: 2, mt: 2 }}>{err}</Alert>}

      <Paper variant="outlined" sx={{ mt: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Display name</TableCell>
                <TableCell sx={{ width: 200 }}>Role</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton width={120} /></TableCell>
                    <TableCell><Skeleton width={160} /></TableCell>
                    <TableCell><Skeleton width={140} /></TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} sx={{ borderBottom: 'none' }}>
                    <Stack alignItems="center" spacing={1.5} sx={{ py: 6 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        No users to manage yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Create an admin account to get started.
                      </Typography>
                      <Button
                        variant="contained" disableElevation startIcon={<PersonAddRoundedIcon />}
                        onClick={() => setAddOpen(true)} sx={{ mt: 1 }}
                      >
                        Add admin
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((u) => {
                  const isSelf = u.id === me?.id;
                  const outranked = myLevel > (ROLE_LEVEL[u.role] ?? 0);
                  const editable = !isSelf && outranked;
                  return (
                    <TableRow key={u.id} hover>
                      <TableCell>@{u.username}</TableCell>
                      <TableCell>{u.displayName || '—'}</TableCell>
                      <TableCell>
                        {editable ? (
                          <Select
                            size="small" fullWidth value={u.role}
                            disabled={savingId === u.id}
                            onChange={(e) => changeRole(u, e.target.value)}
                          >
                            {/* Current role always shown, even Super Admin, so the
                                dropdown reflects reality; only assignable roles are options. */}
                            {[...new Set([u.role, ...ASSIGNABLE_ROLES])].map((r) => (
                              <MenuItem key={r} value={r} disabled={r === 'Super Admin'}>
                                {r}
                              </MenuItem>
                            ))}
                          </Select>
                        ) : (
                          <Chip label={u.role} size="small" variant="outlined"
                            color={isSelf ? 'default' : 'default'} />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <AddAdminDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(msg) => { setToast(msg); load(); }}
      />

      <Snackbar
        open={!!toast} autoHideDuration={4000} onClose={() => setToast('')}
        message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}


function AddAdminDialog({ open, onClose, onCreated }) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);
  const [result, setResult] = useState(null); // set once the account is created
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setEmail(''); setDisplayName(''); setUsername('');
    setErr(null); setResult(null); setCopied(false);
  };
  const handleClose = () => { reset(); onClose(); };

  // Client-side validation mirrors the backend rules, so obvious mistakes are
  // caught before the request. The backend is still the real gatekeeper.
  const cleanUsername = username.trim().toLowerCase();
  const usernameValid = /^[a-z0-9_]{3,20}$/.test(cleanUsername);
  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const formValid = emailValid && displayName.trim() && usernameValid;

  const create = async () => {
    if (!formValid) return;
    setSubmitting(true); setErr(null);
    try {
      const { data } = await api('/admin/users', {
        method: 'POST',
        body: {
          email: email.trim(),
          displayName: displayName.trim(),
          username: cleanUsername,
        },
      });
      setResult({
        email: data.user.email,
        tempPassword: data.tempPassword,      // shown once, here
        emailDelivery: data.emailDelivery,    // { sent } or { sent:false, loginUrl }
      });
      onCreated(`Admin account created for @${data.user.username}`);
    } catch (e) {
      setErr(e.message); // e.g. "Email already registered" / "Username already taken"
    } finally {
      setSubmitting(false);
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(result.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked - the field is selectable as a fallback */ }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      {!result ? (
        <>
          <DialogTitle sx={{ fontWeight: 700 }}>Create an admin</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              A new account is created with a temporary password. The admin sets
              their own password the first time they log in.
            </Typography>

            {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <TextField
                size="small" label="Email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!email && !emailValid}
                helperText={!!email && !emailValid ? 'Enter a valid email' : ' '}
              />
              <TextField
                size="small" label="Display name" value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <TextField
                size="small" label="Username" value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={!!username && !usernameValid}
                helperText={
                  !!username && !usernameValid
                    ? '3-20 chars: lowercase letters, numbers, underscores'
                    : ' '
                }
                InputProps={{
                  startAdornment: <InputAdornment position="start">@</InputAdornment>,
                }}
              />
              <Box>
                <Chip label="Role: Admin" size="small" color="primary" variant="outlined" />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} color="inherit">Cancel</Button>
            <Button
              variant="contained" disableElevation onClick={create}
              disabled={!formValid || submitting}
            >
              {submitting ? 'Creating...' : 'Create account'}
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleRoundedIcon color="primary" /> Account created
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Share these with the new admin. This password is shown only once.
            </Typography>

            <Stack spacing={2}>
              <TextField
                size="small" label="Email" value={result.email}
                InputProps={{ readOnly: true }}
              />
              <TextField
                size="small" label="Temporary password" value={result.tempPassword}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end" onClick={copyPassword} size="small">
                        <ContentCopyRoundedIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText={copied ? 'Copied!' : ' '}
              />
              <Alert severity={result.emailDelivery?.sent ? 'success' : 'info'}>
                {result.emailDelivery?.sent
                  ? 'Credentials were emailed to the new admin.'
                  : `Email isn't set up in dev - share these manually. Login: ${result.emailDelivery?.loginUrl || '/login'}`}
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="contained" disableElevation onClick={handleClose}>Done</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}