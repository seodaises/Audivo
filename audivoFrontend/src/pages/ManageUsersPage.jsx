import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Stack, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Chip, Avatar, Alert, Skeleton, TablePagination, Tooltip,
  Menu, MenuItem, ListItemIcon, ListItemText,
} from '@mui/material';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import SetUserStatusDialog from '../components/SetUserStatusDialog';

// Role name -> level, so the UI can apply the same strict-higher (>) rule the
// backend enforces: you only get actionable controls for users below you.
const ROLE_LEVEL = {
  'Super Admin': 5, 'Admin': 4, 'Moderator': 3, 'Artist': 2, 'Listener': 1,
};

const roleChipColor = (role) => {
  switch (role) {
    case 'Super Admin': return 'error';
    case 'Admin': return 'primary';
    case 'Moderator': return 'warning';
    case 'Artist': return 'info';
    default: return 'default';
  }
};

export default function ManageUsersPage() {
  const { user: me } = useAuth();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);      // MUI TablePagination is 0-indexed
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Status-menu state: which row's chip was clicked (anchor + the row itself).
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRow, setMenuRow] = useState(null);

  // Confirm-dialog state: the row we're about to flip and the value to send.
  const [confirmRow, setConfirmRow] = useState(null);
  const [confirmNext, setConfirmNext] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      // Backend is 1-indexed; MUI is 0-indexed — translate here.
      const { data } = await api(`/admin/users?page=${page + 1}&limit=${limit}`);
      setRows(data.users);
      setTotal(data.pagination.total);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => { load(); }, [load]);

  const myLevel = ROLE_LEVEL[me?.role] ?? 0;

  const openStatusMenu = (e, row) => {
    setMenuAnchor(e.currentTarget);
    setMenuRow(row);
  };
  const closeStatusMenu = () => {
    setMenuAnchor(null);
    setMenuRow(null);
  };

  // Menu item clicked -> stage the confirm dialog with the opposite of the
  // current status, then close the menu.
  const requestToggle = () => {
    if (!menuRow) return;
    setConfirmRow(menuRow);
    setConfirmNext(!menuRow.isActive);
    closeStatusMenu();
  };

  // The actual write. Passed to the dialog; it owns the busy state and calls
  // onClose. On success we refetch so the row reflects the DB.
  const doToggle = async () => {
    await api(`/admin/users/${confirmRow.id}/status`, {
      method: 'PATCH',
      body: { isActive: confirmNext },
    });
    await load();
  };

  const closeConfirm = () => {
    setConfirmRow(null);
    setConfirmNext(null);
  };

  const COLS = 6;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Manage users</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Everyone with an Audivo account. Click a status chip to enable or disable an
        account; change roles from the Manage Roles page.
      </Typography>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      <Paper variant="outlined">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton width={160} /></TableCell>
                    <TableCell><Skeleton width={100} /></TableCell>
                    <TableCell><Skeleton width={160} /></TableCell>
                    <TableCell><Skeleton width={110} /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLS}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No users to show yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((u) => {
                  const isSelf = u.id === me?.id;
                  const outranked = myLevel > (ROLE_LEVEL[u.role] ?? 0);
                  const canActOnStatus = outranked && !isSelf;

                  const statusTip = isSelf
                    ? 'You cannot change your own status'
                    : !outranked
                      ? 'You cannot modify a user at or above your level'
                      : u.isActive
                        ? 'Click to deactivate this account'
                        : 'Click to reactivate this account';

                  const roleTip = isSelf
                    ? 'You cannot change your own role'
                    : !outranked
                      ? 'You cannot modify a user at or above your level'
                      : 'Change this role from Manage Roles';

                  return (
                    <TableRow key={u.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                            {(u.displayName || u.username || '?').charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {u.displayName || '—'}
                            {isSelf && (
                              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                (you)
                              </Typography>
                            )}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">@{u.username}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{u.email || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{u.phoneNumber || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={roleTip}>
                          <Chip label={u.role} color={roleChipColor(u.role)} size="small"
                            variant={outranked && !isSelf ? 'filled' : 'outlined'} />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={statusTip}>
                          {/* span wrapper so the tooltip still shows on a disabled chip */}
                          <span>
                            <Chip
                              label={u.isActive ? 'Active' : 'Inactive'}
                              color={u.isActive ? 'success' : 'default'}
                              size="small"
                              variant={u.isActive ? 'filled' : 'outlined'}
                              onClick={canActOnStatus ? (e) => openStatusMenu(e, u) : undefined}
                              sx={{ cursor: canActOnStatus ? 'pointer' : 'default' }}
                            />
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Paper>

      {/* The one action menu, positioned at whichever chip was clicked. */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeStatusMenu}>
        {menuRow?.isActive ? (
          <MenuItem onClick={requestToggle}>
            <ListItemIcon><BlockRoundedIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Deactivate account</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={requestToggle}>
            <ListItemIcon><CheckCircleRoundedIcon fontSize="small" color="success" /></ListItemIcon>
            <ListItemText>Reactivate account</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <SetUserStatusDialog
        open={Boolean(confirmRow)}
        target={confirmRow}
        nextActive={confirmNext}
        onClose={closeConfirm}
        onConfirm={doToggle}
      />
    </Box>
  );
}