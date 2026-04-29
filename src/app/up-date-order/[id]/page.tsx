import UpdateOrderClient from "./UpdateOrderClient";

export default async function Page({
    params,
}:{params:Promise<{id:string}>;
}){
    const {id} = await params;
    return <UpdateOrderClient id={id}/>;
}
