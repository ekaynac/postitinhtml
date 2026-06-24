import { useEffect } from "react";
import { Postits, PostitsConfig } from "@postits/core";

export function PostitsProvider({
  config = {},
  children,
}: {
  config?: PostitsConfig;
  children?: React.ReactNode;
}) {
  useEffect(() => {
    Postits.init(config);
    return () => Postits.destroy();
  }, []); // mount once
  return <>{children}</>;
}

export default PostitsProvider;
