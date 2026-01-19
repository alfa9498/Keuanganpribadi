const db = require('./config/db');

const seedUser = async () => {
    const user = {
        full_name: 'Test User',
        email: 'test@example.com',
        phone: '08123456789',
        password: 'password' // In real app, this should be hashed!
    };

    const query = `
        INSERT INTO users (full_name, email, phone, password) 
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password = VALUES(password)
    `;

    db.query(query, [user.full_name, user.email, user.phone, user.password], (err, result) => {
        if (err) {
            console.error('❌ Failed to insert user:', err.message);
        } else {
            console.log('✅ Sample user inserted/updated successfully!');
            console.log('Use this credential to login:');
            console.log(`Email: ${user.email}`);
            console.log(`Password: ${user.password}`);
        }
        process.exit(0);
    });
};

seedUser();
