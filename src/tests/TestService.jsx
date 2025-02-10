// import React, { useEffect } from 'react';
// import { addUserToFirestore, getUserFromFirestore } from '../services/userService';

// const TestService = () => {
//   useEffect(() => {
//     const testUserService = async () => {
//       try {
//         const testUserId = 'testUser123';

//         // Add a user to Firestore
//         await addUserToFirestore(testUserId, {
//           fullName: 'John Doe',
//           email: 'johndoe@example.com',
//           role: 'freelancer',
//           location: 'Lagos',
//           skills: 'React, Node.js',
//         });
//         console.log('User added successfully!');

//         // Retrieve the user from Firestore
//         const userData = await getUserFromFirestore(testUserId);
//         console.log('Retrieved user data:', userData);
//       } catch (error) {
//         console.error('Error testing userService:', error);
//       }
//     };

//     testUserService();
//   }, []);

//   return <div>Testing Firestore Services...</div>;
// };

// export default TestService;


// import React, { useEffect } from 'react';
// import { sendMessage, getMessagesBetweenUsers } from '../services/messageService';

// const TestService = () => {
//   useEffect(() => {
//     const testMessageService = async () => {
//       try {
//         const senderId = 'user123';
//         const receiverId = 'client123';

//         // Send a message
//         await sendMessage({
//           senderId,
//           receiverId,
//           message: 'Hello! I am interested in your job posting.',
//           timestamp: new Date(),
//         });
//         console.log('Message sent successfully!');

//         // Retrieve messages between two users
//         const messages = await getMessagesBetweenUsers(senderId, receiverId);
//         console.log('Retrieved messages:', messages);
//       } catch (error) {
//         console.error('Error testing messageService:', error);
//       }
//     };

//     testMessageService();
//   }, []);

//   return <div>Testing Firestore Services...</div>;
// };

// export default TestService;


// import React, { useEffect } from 'react';
// import { createJob, getAllJobs } from '../services/jobService';

// const TestService = () => {
//   useEffect(() => {
//     const testJobService = async () => {
//       try {
//         // Create a new job
//         const jobId = await createJob({
//           title: 'Web Development Project',
//           description: 'Build a responsive website.',
//           budget: 1000,
//           clientId: 'client123',
//         });
//         console.log('Job created successfully with ID:', jobId);

//         // Retrieve all jobs
//         const jobs = await getAllJobs();
//         console.log('Retrieved jobs:', jobs);
//       } catch (error) {
//         console.error('Error testing jobService:', error);
//       }
//     };

//     testJobService();
//   }, []);

//   return <div>Testing Firestore Services...</div>;
// };

// export default TestService;
