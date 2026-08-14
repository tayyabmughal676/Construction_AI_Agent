import { Elysia } from 'elysia';
import { mongodb } from '../db/mongodb';
import { ObjectId } from 'mongodb';
import { logger } from '../config/logger';

function buildIdFilter(id: string, customIdField: string) {
    if (ObjectId.isValid(id) && id.length === 24) {
        return { $or: [{ [customIdField]: id }, { _id: new ObjectId(id) }] };
    }
    return { [customIdField]: id };
}

const hrRouter = new Elysia();

/**
 * GET /api/hr/employees
 * Returns full workforce directory.
 */
hrRouter.get('/employees', async (c) => {
    try {
        const db = mongodb.getDb();
        const rawEmployees = await db.collection('employees').find({}).toArray();

        const employees = rawEmployees.map((emp: any) => ({
            id: emp.employeeId || emp._id.toString(),
            mongoId: emp._id.toString(),
            employeeId: emp.employeeId || 'EMP-' + emp._id.toString().substring(0, 4),
            name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || 'Unnamed',
            firstName: emp.firstName || emp.name?.split(' ')[0] || '',
            lastName: emp.lastName || emp.name?.split(' ')[1] || '',
            role: emp.position || emp.role || 'Staff',
            position: emp.position || emp.role || 'Staff',
            department: emp.department || 'General',
            email: emp.email || 'n/a',
            salary: emp.salary || 0,
            status: emp.status || 'Active'
        }));

        return { employees };
    } catch (error) {
        logger.error({ error }, 'Error in GET /api/hr/employees');
        c.set.status = 500;
        return { error: 'Internal server error' };
    }
});

/**
 * POST /api/hr/employees
 * Create a new employee.
 */
hrRouter.post('/employees', async (c) => {
    try {
        const body = (c.body as any) || await c.request.clone().json();
        const db = mongodb.getDb();

        const newEmployee = {
            employeeId: body.employeeId || `EMP-${Date.now().toString().slice(-4)}`,
            firstName: body.firstName || body.name?.split(' ')[0] || 'John',
            lastName: body.lastName || body.name?.split(' ')[1] || 'Doe',
            position: body.position || body.role || 'Staff',
            department: body.department || 'Engineering',
            email: body.email || 'employee@company.com',
            salary: Number(body.salary) || 65000,
            status: body.status || 'Active',
            createdAt: new Date()
        };

        const result = await db.collection('employees').insertOne(newEmployee);
        return { success: true, employee: { ...newEmployee, _id: result.insertedId } };
    } catch (error) {
        logger.error({ error }, 'Error in POST /api/hr/employees');
        c.set.status = 500;
        return { error: 'Failed to create employee' };
    }
});

/**
 * PUT /api/hr/employees/:id
 * Update an existing employee.
 */
hrRouter.put('/employees/:id', async (c) => {
    try {
        const { id } = c.params;
        const body = (c.body as any) || await c.request.clone().json();
        const db = mongodb.getDb();

        const updateData: any = {};
        if (body.firstName) updateData.firstName = body.firstName;
        if (body.lastName) updateData.lastName = body.lastName;
        if (body.position || body.role) updateData.position = body.position || body.role;
        if (body.department) updateData.department = body.department;
        if (body.email) updateData.email = body.email;
        if (body.salary) updateData.salary = Number(body.salary);
        if (body.status) updateData.status = body.status;
        updateData.updatedAt = new Date();

        await db.collection('employees').updateOne(
            buildIdFilter(id, 'employeeId'),
            { $set: updateData }
        );

        return { success: true, message: 'Employee updated successfully' };
    } catch (error) {
        logger.error({ error }, 'Error in PUT /api/hr/employees');
        c.set.status = 500;
        return { error: 'Failed to update employee' };
    }
});

/**
 * DELETE /api/hr/employees/:id
 * Delete an employee.
 */
hrRouter.delete('/employees/:id', async (c) => {
    try {
        const { id } = c.params;
        const db = mongodb.getDb();

        await db.collection('employees').deleteOne(
            buildIdFilter(id, 'employeeId')
        );

        return { success: true, message: 'Employee deleted successfully' };
    } catch (error) {
        logger.error({ error }, 'Error in DELETE /api/hr/employees');
        c.set.status = 500;
        return { error: 'Failed to delete employee' };
    }
});

export default hrRouter;
