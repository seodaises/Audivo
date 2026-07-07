import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Button, Alert, TextField,
} from '@mui/material';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';

export default function DeleteAccountDialog({ open, username, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState('');

  const armed = typed.trim().toLowerCase() === String(username || '').toLowerCase();

  const handleConfirm = async () => {
    if (!armed) return;
    setBusy(true);
    try {
      await onConfirm(); // parent: DELETE /auth/me then logout()
      // No onClose() — logout unmounts this tree; nothing to reset.
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    if (busy) return;
    setTyped('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DeleteForeverRoundedIcon color="error" fontSize="small" />
        Delete your account?
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          This removes your account for good. You won&apos;t be able to log back
          in, and this can&apos;t be undone from here.
        </DialogContentText>
        <Alert severity="error" variant="outlined" sx={{ mb: 2 }}>
          Type your username <strong>@{username}</strong> to confirm.
        </Alert>
        <TextField
          fullWidth
          size="small"
          placeholder={username}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={busy}
          autoComplete="off"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={busy}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          disableElevation
          onClick={handleConfirm}
          disabled={busy || !armed}
          startIcon={<DeleteForeverRoundedIcon />}
        >
          {busy ? 'Deleting…' : 'Delete my account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}