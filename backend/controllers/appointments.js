const { pool } = require('../config/database');

const getAppointments = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Niste prijavljeni' });
        }

        const [appointments] = await pool.query(
            `SELECT a.*, u.first_name, u.last_name, u.email, u.phone 
             FROM appointments a 
             JOIN users u ON a.user_id = u.id 
             WHERE a.user_id = ?
             ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
            [req.session.userId]
        );

        res.json(appointments);
    } catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({ error: 'Napaka pri pridobivanju terminov' });
    }
};

const createAppointment = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Niste prijavljeni' });
        }

        const { barber_name, appointment_date, appointment_time, notes } = req.body;

        if (!barber_name || !appointment_date || !appointment_time) {
            return res.status(400).json({ error: 'Izpolnite vsa polja' });
        }

        const [result] = await pool.query(
            'INSERT INTO appointments (user_id, barber_name, appointment_date, appointment_time, notes) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, barber_name, appointment_date, appointment_time, notes || '']
        );

        res.json({ success: true, message: 'Termin uspešno rezerviran', id: result.insertId });
    } catch (error) {
        console.error('Create appointment error:', error);
        res.status(500).json({ error: 'Napaka pri rezervaciji termina' });
    }
};

const updateAppointment = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Niste prijavljeni' });
        }

        const { id } = req.params;
        const { barber_name, appointment_date, appointment_time, notes, status } = req.body;

        const [existing] = await pool.query(
            'SELECT * FROM appointments WHERE id = ? AND user_id = ?',
            [id, req.session.userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Termin ne obstaja' });
        }

        await pool.query(
            'UPDATE appointments SET barber_name = ?, appointment_date = ?, appointment_time = ?, notes = ?, status = ? WHERE id = ?',
            [barber_name, appointment_date, appointment_time, notes, status || 'pending', id]
        );

        res.json({ success: true, message: 'Termin posodobljen' });
    } catch (error) {
        console.error('Update appointment error:', error);
        res.status(500).json({ error: 'Napaka pri posodobitvi termina' });
    }
};

const deleteAppointment = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Niste prijavljeni' });
        }

        const { id } = req.params;

        const [result] = await pool.query(
            'DELETE FROM appointments WHERE id = ? AND user_id = ?',
            [id, req.session.userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Termin ne obstaja' });
        }

        res.json({ success: true, message: 'Termin izbrisan' });
    } catch (error) {
        console.error('Delete appointment error:', error);
        res.status(500).json({ error: 'Napaka pri brisanju termina' });
    }
};

const getAllAppointments = async (req, res) => {
    try {
        const [appointments] = await pool.query(
            `SELECT a.*, u.first_name, u.last_name, u.email, u.phone 
             FROM appointments a 
             JOIN users u ON a.user_id = u.id 
             ORDER BY a.appointment_date DESC, a.appointment_time DESC`
        );

        res.json(appointments);
    } catch (error) {
        console.error('Get all appointments error:', error);
        res.status(500).json({ error: 'Napaka pri pridobivanju terminov' });
    }
};

const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await pool.query(
            'UPDATE appointments SET status = ? WHERE id = ?',
            [status, id]
        );

        res.json({ success: true, message: 'Status posodobljen' });
    } catch (error) {
        console.error('Update appointment status error:', error);
        res.status(500).json({ error: 'Napaka pri posodobitvi statusa' });
    }
};

const deleteAppointmentAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query('DELETE FROM appointments WHERE id = ?', [id]);

        res.json({ success: true, message: 'Termin izbrisan' });
    } catch (error) {
        console.error('Delete appointment admin error:', error);
        res.status(500).json({ error: 'Napaka pri brisanju termina' });
    }
};

module.exports = {
    getAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAllAppointments,
    updateAppointmentStatus,
    deleteAppointmentAdmin
};
