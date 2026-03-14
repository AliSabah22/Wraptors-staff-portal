"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Bell, Shield, Palette } from "lucide-react";
import { MetaIntegrationCard } from "@/components/settings/meta-integration-card";

export default function SettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-2xl"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-wraptors-muted mt-0.5">Shop configuration</p>
      </div>

      <Card className="border-wraptors-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-wraptors-gold" /> Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="shop-name">Shop name</Label>
            <Input
              id="shop-name"
              defaultValue="Wraptors"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="support-email">Support email</Label>
            <Input
              id="support-email"
              type="email"
              defaultValue="support@wraptors.com"
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-wraptors-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-wraptors-gold" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-wraptors-muted">
            Configure which events trigger internal notifications. (Placeholder — connect in production.)
          </p>
        </CardContent>
      </Card>

      <Card className="border-wraptors-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-wraptors-gold" /> Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-wraptors-muted">
            Role-based access control (RBAC) can be implemented here. Roles: Admin, CEO, Receptionist, Technician, Sales Manager.
          </p>
        </CardContent>
      </Card>

      <MetaIntegrationCard />

      <Card className="border-wraptors-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-wraptors-gold" /> More integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-wraptors-muted">
            Supabase, Stripe, SMS, and other integrations can be added here.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
