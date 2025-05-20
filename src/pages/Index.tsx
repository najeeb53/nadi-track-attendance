
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-gradient-to-b from-nadi-700 to-nadi-600 text-white py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Nadi Attendance Management
            </h1>
            <p className="text-lg mb-8 text-nadi-100">
              A simple, intuitive system to track and manage student attendance
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-nadi-700 hover:bg-nadi-100">
                <Link to="/setup">Setup Classes</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-nadi-800">
                <Link to="/attendance">Mark Attendance</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          How It Works
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-nadi-100 text-nadi-700 flex items-center justify-center mx-auto text-xl font-bold">
                  1
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center mb-3">Setup Classes</h3>
              <p className="text-gray-600 text-center">
                Create up to two classes or subjects and add students with their details and photos.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-nadi-100 text-nadi-700 flex items-center justify-center mx-auto text-xl font-bold">
                  2
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center mb-3">Mark Attendance</h3>
              <p className="text-gray-600 text-center">
                Select a class and date, then mark students as present or absent with a simple click.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-nadi-100 text-nadi-700 flex items-center justify-center mx-auto text-xl font-bold">
                  3
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center mb-3">View Reports</h3>
              <p className="text-gray-600 text-center">
                Generate daily, weekly, or monthly attendance reports and export data to CSV.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-12 text-center">
          <Button asChild size="lg" className="bg-nadi-600 hover:bg-nadi-700">
            <Link to="/setup">Get Started</Link>
          </Button>
        </div>
      </div>
      
      <footer className="bg-gray-100 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} Nadi Attendance App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
