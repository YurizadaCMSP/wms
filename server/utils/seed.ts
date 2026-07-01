import { User } from '../models/User';

export const seedDatabase = async (): Promise<void> => {
  try {
    // Check if admin exists
    const adminExists = await User.findOne({ email: 'adminplataforma' });

    if (!adminExists) {
      await User.create({
        name: 'Administrador da Plataforma',
        email: 'adminplataforma',
        password: 'adminplataforma12345',
        role: 'admin',
        isActive: true,
      });
      console.log('Default admin account created');
      console.log('Email: adminplataforma');
      console.log('Password: adminplataforma12345');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
