type User = {
  _id: string;
  email: string;
  name?: string;
  passwordHash?: string;
};

const MOCK_USERS: User[] = []; 

const findById = async (id: string): Promise<User | null> => {
  // Replace with real DB lookup
  return MOCK_USERS.find(u => u._id === id) ?? null;
};

const findByEmail = async (email: string): Promise<User | null> => {
  return MOCK_USERS.find(u => u.email === email) ?? null;
};

const createUser = async (u: Partial<User>): Promise<User> => {
  const user: User = {
    _id: String(Date.now()),
    email: u.email!,
    name: u.name,
    passwordHash: u.passwordHash,
  };
  MOCK_USERS.push(user);
  return user;
};

export default { findById, findByEmail, createUser };
