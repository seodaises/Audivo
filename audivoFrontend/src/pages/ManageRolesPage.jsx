import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Stack, Button, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Select, MenuItem, Alert, Skeleton, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Avatar, Chip, Divider,
} from '@mui/material';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
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
                        Promote someone to Admin to get started.
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
        onPromoted={(msg) => { setToast(msg); load(); }}
      />

      <Snackbar
        open={!!toast} autoHideDuration={4000} onClose={() => setToast('')}
        message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}


function AddAdminDialog({ open, onClose, onPromoted }) {
  const [username, setUsername] = useState('');
  const [found, setFound] = useState(null);
  const [searching, setSearching] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [err, setErr] = useState(null);

  const reset = () => { setUsername(''); setFound(null); setErr(null); };

  const handleClose = () => { reset(); onClose(); };

  const search = async () => {
    const handle = username.trim().toLowerCase();
    if (!handle) return;
    setSearching(true); setErr(null); setFound(null);
    try {
      const { data } = await api(`/admin/users/search?username=${encodeURIComponent(handle)}`);
      setFound(data);
    } catch (e) {
      setErr(e.message); // "No user found with that username"
    } finally {
      setSearching(false);
    }
  };

  const promote = async () => {
    if (!found) return;
    setPromoting(true); setErr(null);
    try {
      await api(`/admin/users/${found.id}/role`, { method: 'PATCH', body: { role: 'Admin' } });
      onPromoted(`@${found.username} is now Admin`);
      handleClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setPromoting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>Add an admin</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Find a user by their exact username, then promote them to Admin.
        </Typography>

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        <Stack direction="row" spacing={1}>
          <TextField
            size="small" fullWidth label="Username" value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>@</Typography> }}
          />
          <Button
            variant="outlined" onClick={search} disabled={searching || !username.trim()}
            startIcon={<SearchRoundedIcon />}
          >
            {searching ? '…' : 'Find'}
          </Button>
        </Stack>

        {found && (
          <>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {(found.displayName || found.username || '?').charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {found.displayName || '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  @{found.username} · currently {found.role}
                </Typography>
              </Box>
              {found.role === 'Admin' && <Chip label="Already admin" size="small" />}
            </Stack>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">Cancel</Button>
        <Button
          variant="contained" disableElevation onClick={promote}
          disabled={!found || promoting || found.role === 'Admin'}
        >
          {promoting ? 'Promoting…' : 'Promote to Admin'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}