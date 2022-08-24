import { initNavbar } from "../page-template/navbar";

declare global {
  interface Window { apiDomain: string }
}

initNavbar();
