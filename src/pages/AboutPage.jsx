import React from 'react';
import { FaLightbulb, FaHandshake, FaUsers, FaGlobe } from 'react-icons/fa';

const AboutPage = () => {
  const teamMembers = [
    { name: 'John Doe', role: 'CEO & Founder', image: '/placeholder.svg?height=200&width=200' },
    { name: 'Jane Smith', role: 'CTO', image: '/placeholder.svg?height=200&width=200' },
    { name: 'Mike Johnson', role: 'Head of Operations', image: '/placeholder.svg?height=200&width=200' },
    { name: 'Sarah Brown', role: 'Head of Marketing', image: '/placeholder.svg?height=200&width=200' },
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-center text-indigo-700 mb-8">About FreelanceHub</h1>
        
        <section className="bg-white rounded-lg shadow-lg p-6 mb-12">
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="text-gray-700 mb-4">
            At FreelanceHub, our mission is to empower freelancers and businesses by providing a seamless platform for collaboration, growth, and success. We believe in creating opportunities that transcend geographical boundaries and foster a global community of talented professionals.
          </p>
          <p className="text-gray-700">
            Our platform is designed to connect skilled freelancers with businesses seeking expertise, enabling both parties to thrive in the ever-evolving digital landscape.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: FaLightbulb, title: 'Innovation', description: 'We constantly strive to improve and innovate our platform.' },
              { icon: FaHandshake, title: 'Trust', description: 'We build trust through transparency and reliability.' },
              { icon: FaUsers, title: 'Community', description: 'We foster a supportive and collaborative community.' },
              { icon: FaGlobe, title: 'Global Reach', description: 'We connect talent and opportunities worldwide.' },
            ].map((value, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center text-center">
                <value.icon className="text-4xl text-indigo-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-700">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-lg p-6 mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">Our Story</h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-gray-700 mb-4">
              FreelanceHub is my final year project in my degree at Bayero University Kano. It was founded to address the challenges faced by freelancers and clients in the gig economy. The platform aims to provide a user-friendly experience for both parties, ensuring successful collaborations.
            </p>
            <p className="text-gray-700 mb-4">
              As I continue to develop this project, my commitment to innovation, quality, and user satisfaction remains at the core of everything I do. I'm excited about the future of work and am dedicated to shaping it for the better.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6 text-center">About Me</h2>
          <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
            <img src="/http://i.ibb.co/Hxfq5qz/ishaq.jpg" alt="Ishaq Usman" className="w-32 h-32 rounded-full mb-4" />
            <h3 className="text-xl font-semibold mb-1">Ishaq Usman</h3>
            <p className="text-gray-600">Final Year Student, Department of Software Engineering, Bayero University Kano</p>
            <p className="text-gray-600">Email: ishaquusmanu3@gmail.com</p>
          </div>
        </section>

        {/* <section>
          <h2 className="text-2xl font-semibold mb-6 text-center">Our Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
                <img src={member.image || "/placeholder.svg"} alt={member.name} className="w-32 h-32 rounded-full mb-4" />
                <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </section> */}
      </div>
    </div>
  );
};

export default AboutPage;