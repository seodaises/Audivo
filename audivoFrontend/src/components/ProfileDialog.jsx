import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Stack, Avatar, Typography, TextField, Button, Chip,
  IconButton, Divider, Alert, Grid, Tooltip,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { useAuth } from '../context/AuthContext';

// Fixed gender options — kept small and inclusive; stored as a plain string.
const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

// Build the initial editable form from the current user object.
const formFromUser = (u) => ({
  displayName: u?.name ?? '',
  firstName: u?.firstName ?? '',
  lastName: u?.lastName ?? '',
  avatarUrl: u?.avatarUrl ?? '',
  gender: u?.gender ?? '',
  birthday: u?.birthday ?? '',           // 'YYYY-MM-DD' or '' (native date input)
  phoneNumber: u?.phoneNumber ?? '',
  addressStreet: u?.address?.street ?? '',
  addressCity: u?.address?.city ?? '',
  addressCountry: u?.address?.country ?? '',
  addressPostalCode: u?.address?.postalCode ?? '',
});

export default function ProfileDialog({ open, onClose }) {
  const { user, updateProfile, refreshUser, loading, error } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(formFromUser(user));
  const [saved, setSaved] = useState(false);

  // Refresh from the server each time the dialog opens, so it reflects truth
  // (not just the cached localStorage copy).
  useEffect(() => {
    if (open) {
      refreshUser();
      setEditing(false);
      setSaved(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the form in sync whenever the user object changes.
  useEffect(() => { setForm(formFromUser(user)); }, [user]);

  if (!user) return null;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setSaved(false);
    const ok = await updateProfile(form);
    if (ok) { setEditing(false); setSaved(true); }
  };

  const handleCancel = () => {
    setForm(formFromUser(user));
    setEditing(false);
  };

  const initial = (user.name || user.email || '?').charAt(0).toUpperCase();
  const addressLine = [
    user.address?.street, user.address?.city,
    user.address?.postalCode, user.address?.country,
  ].filter(Boolean).join(', ');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        Your profile
        <Box sx={{ flexGrow: 1 }} />
        {!editing && (
          <Tooltip title="Edit profile">
            <IconButton onClick={() => setEditing(true)} size="small"><EditRoundedIcon /></IconButton>
          </Tooltip>
        )}
        <IconButton onClick={onClose} size="small"><CloseRoundedIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Header block: avatar + name + role + verification badge */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar src={user.avatarUrl || undefined} sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 28 }}>
            {user.avatarUrl ? null : initial}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {user.fullName || user.name}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <Chip label={user.role} color="primary" variant="outlined" size="small" />
              {user.isVerified ? (
                <Chip icon={<VerifiedRoundedIcon />} label="Verified" color="success" variant="outlined" size="small" />
              ) : (
                <Chip icon={<ErrorOutlineRoundedIcon />} label="Unverified" color="warning" variant="outlined" size="small" />
              )}
            </Stack>
          </Box>
        </Stack>

        {saved && <Alert severity="success" sx={{ mb: 2 }}>Profile updated.</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Divider sx={{ mb: 2 }} />

        {editing ? (
          // -------- EDIT MODE --------
          <Stack spacing={2}>
            <TextField label="Display name" fullWidth value={form.displayName} onChange={set('displayName')} required />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="First name" fullWidth value={form.firstName} onChange={set('firstName')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Last name" fullWidth value={form.lastName} onChange={set('lastName')} />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="gender-label">Gender</InputLabel>
                  <Select
                    labelId="gender-label"
                    label="Gender"
                    value={form.gender}
                    onChange={set('gender')}
                  >
                    <MenuItem value=""><em>Prefer not to say</em></MenuItem>
                    {GENDER_OPTIONS.filter((o) => o !== 'Prefer not to say').map((opt) => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Birthday"
                  type="date"
                  fullWidth
                  value={form.birthday}
                  onChange={set('birthday')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <TextField label="Phone number" fullWidth value={form.phoneNumber} onChange={set('phoneNumber')}
              placeholder="e.g. +92 300 1234567" />

            <TextField label="Avatar URL" fullWidth value={form.avatarUrl} onChange={set('avatarUrl')}
              placeholder="https://…" helperText="Paste an image URL" />
            <Typography variant="overline" color="text.secondary">Address</Typography>
            <TextField label="Street" fullWidth value={form.addressStreet} onChange={set('addressStreet')} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="City" fullWidth value={form.addressCity} onChange={set('addressCity')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Postal code" fullWidth value={form.addressPostalCode} onChange={set('addressPostalCode')} />
              </Grid>
            </Grid>
            <TextField label="Country" fullWidth value={form.addressCountry} onChange={set('addressCountry')} />
          </Stack>
        ) : (
          // -------- VIEW MODE --------
          <Stack spacing={1.5}>
            <Field label="Email" value={user.email} />
            <Field label="First name" value={user.firstName} />
            <Field label="Last name" value={user.lastName} />
            <Field label="Gender" value={user.gender} />
            <Field label="Birthday" value={user.birthday} />
            <Field label="Phone" value={user.phoneNumber} />
            <Field label="Address" value={addressLine} />
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {editing ? (
          <>
            <Button onClick={handleCancel} disabled={loading}>Cancel</Button>
            <Button variant="contained" disableElevation onClick={handleSave} disabled={loading}>
              {loading ? 'Saving…' : 'Save changes'}
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// Small read-only label/value row; shows an em dash when empty.
function Field({ label, value }) {
  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || '—'}</Typography>
    </Box>
  );
}