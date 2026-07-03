import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Stack, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Chip, Avatar, Alert, Skeleton, TablePagination, Tooltip,
} from '@mui/material';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

// Role name -> level, so the UI can apply the same strict-higher (>) rule the
// backend enforces: you only see actionable controls for users below you.
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

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Manage users</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Everyone with an Audivo account. You can change roles from the Manage Roles page.
      </Typography>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      <Paper variant="outlined">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Role</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton width={180} /></TableCell>
                    <TableCell><Skeleton width={120} /></TableCell>
                    <TableCell><Skeleton width={90} /></TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No users to show yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((u) => {
                  const isSelf = u.id === me?.id;
                  const outranked = myLevel > (ROLE_LEVEL[u.role] ?? 0);
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
                        <Tooltip
                          title={
                            isSelf ? 'You cannot change your own role'
                            : !outranked ? 'You cannot modify a user at or above your level'
                            : 'Change this role from Manage Roles'
                          }
                        >
                          <Chip label={u.role} color={roleChipColor(u.role)} size="small"
                            variant={outranked && !isSelf ? 'filled' : 'outlined'} />
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
    </Box>
  );
}