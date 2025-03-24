import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">About Skill Forge</h1>
          <p className="text-muted-foreground mt-2">
            Learn more about our platform and the team behind it.
          </p>
        </div>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
              <CardDescription>Enhancing workplace training through AI-powered learning</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Skill Forge is designed to revolutionize how engineering companies approach training and 
                professional development. Our platform leverages the power of generative AI to create 
                personalized, interactive learning experiences that adapt to each learner's needs.
              </p>
              <p>
                In today's rapidly evolving technological landscape, traditional training methods often 
                fall short. Skill Forge bridges this gap by combining high-quality video and document-based 
                learning with intelligent AI assistance that can answer questions, provide clarification, 
                and generate additional learning materials on demand.
              </p>
              <h3 className="text-lg font-semibold mt-6">How Generative AI Enhances Training</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="font-medium">Real-time assistance:</span> Our AI assistant provides 
                  immediate responses to learner questions, eliminating wait times for instructor feedback.
                </li>
                <li>
                  <span className="font-medium">Personalized learning paths:</span> The system adapts to 
                  each user's learning pace and style, recommending appropriate resources.
                </li>
                <li>
                  <span className="font-medium">Content enrichment:</span> AI automatically generates 
                  supplementary materials, quizzes, and exercises to reinforce learning.
                </li>
                <li>
                  <span className="font-medium">Efficient knowledge extraction:</span> Users can highlight or 
                  annotate documents to ask specific questions, making complex materials more accessible.
                </li>
                <li>
                  <span className="font-medium">Continuous improvement:</span> The platform learns from user 
                  interactions to improve its responses and recommendations over time.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Our Team</CardTitle>
              <CardDescription>The talented individuals who brought Skill Forge to life</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold">Developer</h3>
                  <ul className="mt-2 space-y-1">
                    <li className="flex items-center">
                      <div className="mr-2 h-2 w-2 rounded-full bg-primary" />
                      <span className="font-medium">Syafiq Azrin</span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold">Contributing Members</h3>
                  <ul className="mt-2 space-y-1">
                    <li className="flex items-center">
                      <div className="mr-2 h-2 w-2 rounded-full bg-primary" />
                      <span className="font-medium">Gerard</span>
                    </li>
                    <li className="flex items-center">
                      <div className="mr-2 h-2 w-2 rounded-full bg-primary" />
                      <span className="font-medium">Jason</span>
                    </li>
                    <li className="flex items-center">
                      <div className="mr-2 h-2 w-2 rounded-full bg-primary" />
                      <span className="font-medium">Afiq</span>
                    </li>
                    <li className="flex items-center">
                      <div className="mr-2 h-2 w-2 rounded-full bg-primary" />
                      <span className="font-medium">Bushra</span>
                    </li>
                    <li className="flex items-center">
                      <div className="mr-2 h-2 w-2 rounded-full bg-primary" />
                      <span className="font-medium">Desiree</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
              <CardDescription>Have questions or suggestions?</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                We're always looking to improve Skill Forge and would love to hear your feedback. 
                For any questions, support needs, or suggestions, please reach out to our team.
              </p>
              <div className="mt-4">
                <p className="font-medium">Email:</p>
                <p className="text-muted-foreground">support@skillforge.example.com</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}