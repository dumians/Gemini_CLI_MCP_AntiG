import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
    const customToken = req.headers['x-mesh-token'] || req.headers['x-auth-token'];
    let token = customToken;

    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query?.token) {
            token = req.query.token;
        }
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};
