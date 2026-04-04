// import { Link, useLocation } from "wouter";
// import { useAuth } from "@/hooks/use-auth";
// import { Button } from "@/components/ui/button";
// import { Leaf, LayoutDashboard, Map, Activity, BarChart3, Info, LogOut, User } from "lucide-react";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// export function Navigation() {
//   const [location] = useLocation();
//   const { user, logout } = useAuth();

//   const navItems = [
//     { href: "/", label: "Home", icon: Leaf },
//     { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
//     { href: "/trip-planner", label: "Trip Planner", icon: Map },
//     { href: "/health", label: "Health Guide", icon: Activity },
//     { href: "/report", label: "Reports", icon: BarChart3 },
//     { href: "/about", label: "About", icon: Info },
//   ];

//   return (
//     <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md transition-all">
//       <div className="container mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex h-16 items-center justify-between">
//           <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary transition-colors hover:text-primary/90">
//             <Leaf className="h-8 w-8 text-primary fill-current" />
//             <span className="hidden sm:block text-foreground">Air<span className="text-primary">Vision</span></span>
//           </Link>

//           <div className="hidden md:flex items-center gap-1">
//             {navItems.map((item) => {
//               const isActive = location === item.href;
//               return (
//                 <Link key={item.href} href={item.href}>
//                   <div className={`
//                     flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer
//                     ${isActive 
//                       ? "bg-primary/10 text-primary font-semibold" 
//                       : "text-muted-foreground hover:bg-muted hover:text-foreground"}
//                   `}>
//                     <item.icon className="h-4 w-4" />
//                     {item.label}
//                   </div>
//                 </Link>
//               );
//             })}
//           </div>

//           <div className="flex items-center gap-4">
//             {user ? (
//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-border">
//                     <Avatar className="h-9 w-9">
//                       <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
//                       <AvatarFallback className="bg-primary/10 text-primary">
//                         {user.firstName ? user.firstName[0] : "U"}
//                       </AvatarFallback>
//                     </Avatar>
//                   </Button>
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent className="w-56" align="end" forceMount>
//                   <DropdownMenuLabel className="font-normal">
//                     <div className="flex flex-col space-y-1">
//                       <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
//                       <p className="text-xs leading-none text-muted-foreground">
//                         {user.email}
//                       </p>
//                     </div>
//                   </DropdownMenuLabel>
//                   <DropdownMenuSeparator />
//                   <DropdownMenuItem onClick={() => logout()}>
//                     <LogOut className="mr-2 h-4 w-4" />
//                     <span>Log out</span>
//                   </DropdownMenuItem>
//                 </DropdownMenuContent>
//               </DropdownMenu>
//             ) : (
//               <Link href="/login">
//                 <Button variant="default" className="rounded-full px-6 bg-gradient-to-r from-primary to-emerald-600 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
//                   Login
//                 </Button>
//               </Link>
              
//             )}
//           </div>
//         </div>
//       </div>
      
//       {/* Mobile Navigation */}
//       <div className="md:hidden border-t bg-white/90 backdrop-blur-sm overflow-x-auto">
//         <div className="flex p-2 gap-2 min-w-max">
//           {navItems.map((item) => {
//              const isActive = location === item.href;
//              return (
//               <Link key={item.href} href={item.href}>
//                 <div className={`
//                   flex flex-col items-center justify-center p-3 rounded-xl min-w-[4.5rem] transition-colors
//                   ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"}
//                 `}>
//                   <item.icon className="h-5 w-5 mb-1" />
//                   <span className="text-[10px] font-medium">{item.label}</span>
//                 </div>
//               </Link>
//              );
//           })}
//         </div>
//       </div>
//     </nav>
//   );
// }

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Leaf, LayoutDashboard, Map, Activity, BarChart3, Info, LogOut, MapPin, User, Menu, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home", icon: Leaf },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/map", label: "AQI Map", icon: MapPin },
    { href: "/trip-planner", label: "Trip Planner", icon: Map },
    { href: "/health", label: "Health Guide", icon: Activity },
    { href: "/report", label: "Reports", icon: BarChart3 },
    { href: "/about", label: "About", icon: Info },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md transition-all relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-xl font-bold text-primary transition-colors hover:text-primary/90"
          >
            <Leaf className="h-8 w-8 text-primary fill-current" />
            <span className="hidden sm:block text-foreground">
              Air<span className="text-primary">Vision</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer
                      ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full border border-border"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={undefined}
                        alt={user.name || "User"}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.name ? user.name[0].toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56 !z-[9999]" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/profile">
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                {/* ✅ Signup button */}
                <Link href="/signup">
                  <Button
                    variant="outline"
                    className="hidden sm:flex rounded-full px-6 border-primary text-primary hover:bg-primary/10 transition-all"
                  >
                    Signup
                  </Button>
                </Link>

                {/* ✅ Login button */}
                <Link href="/login">
                  <Button
                    variant="default"
                    className="rounded-full px-4 sm:px-6 bg-gradient-to-r from-primary to-emerald-600 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                  >
                    Login
                  </Button>
                </Link>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden ml-1"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white/95 backdrop-blur-md absolute w-full left-0 shadow-lg top-16">
          <div className="flex flex-col p-4 gap-2">
            {!user && (
              <div className="flex flex-col sm:hidden gap-2 pb-4 border-b border-border/50 mb-2">
                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full justify-center border-primary text-primary hover:bg-primary/10 transition-all"
                  >
                    Signup
                  </Button>
                </Link>
              </div>
            )}
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                  <div
                    className={`
                      flex items-center gap-4 px-4 py-3 rounded-xl text-base font-medium transition-colors
                      ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
                    `}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}

