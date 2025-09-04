import { useEffect, useState } from "react";
import api from "../api/axiosConfig";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from "@mui/material";

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: "", plate: "", type: "", status: "" });

  // Fetch vehicles
  const fetchVehicles = async () => {
    try {
      const res = await api.get("/vehicles");
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  // Handle form input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add or Update Vehicle
  const handleSave = async () => {
    try {
      if (editMode) {
        await api.put(`/vehicles/${formData._id}`, formData);
      } else {
        await api.post("/vehicles", formData);
      }
      fetchVehicles();
      handleClose();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Vehicle
  const handleDelete = async (id) => {
    try {
      await api.delete(`/vehicles/${id}`);
      fetchVehicles();
    } catch (err) {
      console.error(err);
    }
  };

  // Open Form
  const handleOpen = (vehicle = null) => {
    if (vehicle) {
      setEditMode(true);
      setFormData(vehicle);
    } else {
      setEditMode(false);
      setFormData({ id: "", plate: "", type: "", status: "" });
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Vehicle Management</h2>
      <Button variant="contained" color="primary" onClick={() => handleOpen()}>
        Add Vehicle
      </Button>

      <TableContainer component={Paper} className="mt-4">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Vehicle ID</TableCell>
              <TableCell>Plate</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.map((v) => (
              <TableRow key={v._id}>
                <TableCell>{v.id}</TableCell>
                <TableCell>{v.plate}</TableCell>
                <TableCell>{v.type}</TableCell>
                <TableCell>{v.status}</TableCell>
                <TableCell>
                  <Button onClick={() => handleOpen(v)} color="secondary">Edit</Button>
                  <Button onClick={() => handleDelete(v._id)} color="error">Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editMode ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Vehicle ID" name="id" value={formData.id}
            onChange={handleChange} fullWidth margin="dense"
          />
          <TextField
            label="Plate" name="plate" value={formData.plate}
            onChange={handleChange} fullWidth margin="dense"
          />
          <TextField
            label="Type" name="type" value={formData.type}
            onChange={handleChange} fullWidth margin="dense"
          />
          <TextField
            label="Status" name="status" value={formData.status}
            onChange={handleChange} fullWidth margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {editMode ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
