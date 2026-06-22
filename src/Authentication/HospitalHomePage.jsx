// src/pages/HospitalHomePage.jsx
import React from "react";
import {
  Hospital,
  Users,
  Ambulance,
  Clock,
  Calendar,
  Search,
  Droplet,
  ArrowRight,
  Stethoscope,
  Heart,
  Shield,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/cards";
import { Badge } from "../components/ui/Badge";
import logo from "../assets/logo.jpeg";

const HospitalHomePage = () => {
  const features = [
    {
      icon: <Search className="h-5 w-5" />,
      text: "Increase visibility to potential patients",
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      text: "Manage appointments efficiently",
    },
    {
      icon: <Users className="h-5 w-5" />,
      text: "Showcase your doctors and specialties",
    },
    {
      icon: <Clock className="h-5 w-5" />,
      text: "Display real-time availability",
    },
  ];

  const howItWorks = [
    "Sign up and create your hospital profile",
    "Add your doctors and their specialties",
    "Set consultation hours and working times",
    "Manage bookings and patient inquiries",
    "Update your information in real-time",
  ];

  const hospitalFeatures = [
    {
      icon: <Hospital className="h-8 w-8" />,
      title: "Hospital Profile",
      description: "Showcase your facilities and services",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Doctor Management",
      description: "Add and manage your medical staff",
    },
    {
      icon: <Ambulance className="h-8 w-8" />,
      title: "Emergency Services",
      description: "Highlight your emergency capabilities",
    },
    {
      icon: <Droplet className="h-8 w-8" />,
      title: "Blood Services",
      description: "Track and share blood availability",
    },
  ];

  const stats = [
    { value: "500+", label: "Hospitals Registered" },
    { value: "10K+", label: "Doctors Connected" },
    { value: "50K+", label: "Patients Served" },
    { value: "98%", label: "Satisfaction Rate" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={logo}
                  alt="Hosta Logo"
                  className="h-10 w-10 rounded-full border-2 border-green-600 shadow-sm"
                />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
                Hosta
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild className="hover:bg-green-50">
                <Link to="/sign-in" className="text-green-700 hover:text-green-800">
                  Login
                </Link>
              </Button>
              <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
                <Link to="/register" className="flex items-center space-x-1">
                  <span>Sign Up</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Stethoscope className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-900 mb-4 sm:mb-6 leading-tight">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Hosta
            </span>{" "}
            for Hospitals
          </h1>
          <p className="text-lg sm:text-xl text-green-700 max-w-2xl mx-auto mb-8">
            Transform your hospital's digital presence and connect with patients seamlessly
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              asChild 
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-base"
            >
              <Link to="/register" className="flex items-center space-x-2">
                <span>Get Started</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline"
              size="lg"
              className="border-green-600 text-green-600 hover:bg-green-50 px-8 py-6 text-base"
            >
              <Link to="/sign-in">
                Login
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-4 sm:p-6 text-center border border-green-100">
              <p className="text-2xl sm:text-3xl font-bold text-green-700">{stat.value}</p>
              <p className="text-sm text-green-600 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <Card className="border-green-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Search className="h-5 w-5 text-green-600" />
                </div>
                <span>Why Join Hosta?</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3 text-green-700">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      {feature.icon}
                    </div>
                    <span className="text-sm sm:text-base">{feature.text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-green-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <span>How It Works</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {howItWorks.map((step, index) => (
                  <li key={index} className="flex items-start space-x-3 text-green-700">
                    <Badge className="bg-green-600 text-white flex-shrink-0 w-6 h-6 p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-sm sm:text-base">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 shadow-xl mb-12 sm:mb-16">
          <CardContent className="p-6 sm:p-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-green-100 mb-6 sm:mb-8 max-w-2xl mx-auto text-sm sm:text-base">
              Join Hosta today and connect with patients looking for quality healthcare. 
              Start your journey towards digital excellence in healthcare management.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                asChild 
                size="lg"
                className="bg-white text-green-700 hover:bg-green-50 font-semibold px-8 py-6 text-base"
              >
                <Link to="/register" className="flex items-center space-x-2">
                  <span>Sign Up Now</span>
                  <Hospital className="h-5 w-5" />
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10 px-8 py-6 text-base"
              >
                <Link to="/sign-in">
                  Login
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl sm:text-3xl text-green-800">
              Features for Hospitals
            </CardTitle>
            <p className="text-green-600 mt-2">
              Everything you need to manage your hospital's online presence
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {hospitalFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="group p-4 sm:p-6 rounded-lg border border-green-100 bg-white hover:bg-green-50 hover:border-green-300 transition-all duration-300 text-center"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-green-200 transition-colors">
                    <div className="text-green-600">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-green-800 mb-2 text-sm sm:text-base">
                    {feature.title}
                  </h3>
                  <p className="text-green-600 text-xs sm:text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trust Section */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border border-green-100 text-center">
            <Shield className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-green-800 mb-2">Secure & Trusted</h3>
            <p className="text-sm text-green-600">
              Your hospital's data is protected with enterprise-grade security
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border border-green-100 text-center">
            <Heart className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-green-800 mb-2">Patient-Centric</h3>
            <p className="text-sm text-green-600">
              Focus on what matters most - providing quality patient care
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border border-green-100 text-center">
            <Users className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-green-800 mb-2">24/7 Support</h3>
            <p className="text-sm text-green-600">
              Our team is always here to help you succeed
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-green-800 to-emerald-800 text-white mt-12 sm:mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={logo}
                  alt="Hosta Logo"
                  className="h-10 w-10 rounded-full border-2 border-white/30"
                />
                <span className="text-xl font-bold">Hosta</span>
              </div>
              <p className="text-green-200 text-sm">
                Empowering hospitals with digital solutions for better patient care.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-green-200">
                <li><Link to="/sign-in" className="hover:text-white transition-colors">Login</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-green-200">
                <li className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>support@hosta.com</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Address</h4>
              <ul className="space-y-2 text-sm text-green-200">
                <li className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>123 Healthcare Blvd, Medical City</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-green-700/30 pt-6 text-center">
            <p className="text-green-200 text-sm">
              &copy; {new Date().getFullYear()} Hosta. All rights reserved.
            </p>
            <p className="text-green-300 text-xs mt-2">
              Empowering hospitals with digital solutions
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HospitalHomePage;