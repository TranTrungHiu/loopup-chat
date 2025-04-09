import {ComponentPreview, Previews} from '@react-buddy/ide-toolbox'
import {PaletteTree} from './palette'
import GalaxyBackground from "../pages/components/GalaxyBackground";
import SignUp from "../pages/SignUp";

const ComponentPreviews = () => {
    return (
        <Previews palette={<PaletteTree/>}>
            <ComponentPreview path="/GalaxyBackground">
                <GalaxyBackground/>
            </ComponentPreview>
            <ComponentPreview path="/SignUp">
                <SignUp/>
            </ComponentPreview>
        </Previews>
    )
}

export default ComponentPreviews